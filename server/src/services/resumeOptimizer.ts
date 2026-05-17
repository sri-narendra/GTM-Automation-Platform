import { Resume, IResumeDocument } from '../models/Resume';
import { optimizeResumeBullets, generateCoverLetter, generateRecruiterEmail, scoreResume, analyzeJobDescription } from './openai';
import { logger } from '../utils/logger';

export function parseResumeText(content: string): {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Array<{ title: string; company: string; duration: string; description: string[] }>;
  education: Array<{ degree: string; institution: string; year: string }>;
} {
  const lines = content.split('\n').filter((l) => l.trim());

  const emailMatch = content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : '';

  const phoneMatch = content.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{0,4}/);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  const name = lines[0] || '';

  const skillKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'React', 'Angular',
    'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'SQL', 'MongoDB', 'PostgreSQL', 'Redis',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'CI/CD', 'Git', 'REST', 'GraphQL',
    'Machine Learning', 'AI', 'Data Analysis', 'Project Management', 'Agile', 'Scrum',
    'Leadership', 'Communication', 'Product Management', 'Design', 'Figma', 'Sketch',
  ];

  const skills = skillKeywords.filter((skill) => content.toLowerCase().includes(skill.toLowerCase()));

  const experience: Array<{ title: string; company: string; duration: string; description: string[] }> = [];
  const education: Array<{ degree: string; institution: string; year: string }> = [];

  let currentSection = 'header';
  let currentExp: any = null;

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (lower.includes('experience') || lower.includes('employment') || lower.includes('work history')) {
      currentSection = 'experience';
      continue;
    }
    if (lower.includes('education') || lower.includes('academic')) {
      currentSection = 'education';
      continue;
    }
    if (lower.includes('skills') || lower.includes('technologies') || lower.includes('competencies')) {
      currentSection = 'skills';
      continue;
    }

    if (currentSection === 'experience' && line.trim()) {
      if (!currentExp) {
        currentExp = { title: line.trim(), company: '', duration: '', description: [] };
      } else if (currentExp.company === '') {
        currentExp.company = line.trim();
      } else if (currentExp.duration === '') {
        currentExp.duration = line.trim();
      } else {
        currentExp.description.push(line.trim());
        experience.push({ ...currentExp });
        currentExp = null;
      }
    }

    if (currentSection === 'education' && line.trim()) {
      const yearMatch = line.match(/\b(19|20)\d{2}\b/);
      education.push({
        degree: line.trim(),
        institution: '',
        year: yearMatch ? yearMatch[0] : '',
      });
    }
  }

  return { name, email, phone, skills, experience, education };
}

export async function optimizeResume(
  resumeId: string,
  userId: string,
  jobDescription: string
): Promise<{
  optimization: import('../types').IResumeOptimization;
  resume: IResumeDocument;
}> {
  const resume = await Resume.findOne({ _id: resumeId, userId });
  if (!resume) {
    throw new Error('Resume not found');
  }

  const experienceBullets = resume.parsedData?.experience?.flatMap((exp) => exp.description) || [];

  const [optimizedBullets, score, jdAnalysis, coverLetter, recruiterEmail] = await Promise.all([
    experienceBullets.length > 0
      ? optimizeResumeBullets(experienceBullets, jobDescription)
      : Promise.resolve([]),
    scoreResume(resume.content, jobDescription),
    analyzeJobDescription(jobDescription),
    generateCoverLetter(
      {
        name: resume.parsedData?.name || 'Candidate',
        skills: resume.parsedData?.skills || [],
        experience: resume.parsedData?.experience?.map((e) => `${e.title} at ${e.company}`).join(', ') || '',
      },
      jobDescription
    ),
    generateRecruiterEmail(
      {
        name: resume.parsedData?.name || 'Candidate',
        skills: resume.parsedData?.skills || [],
        experience: resume.parsedData?.experience?.map((e) => `${e.title} at ${e.company}`).join(', ') || '',
      },
      jobDescription
    ),
  ]);

  const optimization = {
    jobDescription,
    originalBullets: experienceBullets,
    optimizedBullets,
    atsScore: score.atsScore,
    matchRate: score.matchRate,
    missingKeywords: [...new Set([...score.missingKeywords, ...jdAnalysis.keywords.filter((k) => !resume.content.toLowerCase().includes(k.toLowerCase()))])],
    coverLetter,
    recruiterEmail,
    createdAt: new Date(),
  };

  resume.optimizations.push(optimization);
  await resume.save();

  logger.info({ resumeId, atsScore: score.atsScore }, 'Resume optimized successfully');

  return { optimization, resume };
}
