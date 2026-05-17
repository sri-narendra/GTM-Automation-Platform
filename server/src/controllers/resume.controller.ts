import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Resume } from '../models/Resume';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { parseResumeText, optimizeResume } from '../services/resumeOptimizer';
import { ApiResponse } from '../types';

const optimizeSchema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
});

export async function uploadResume(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded. Please upload a PDF, DOCX, or image file.');
    }

    const content = req.file.buffer.toString('utf-8');
    const parsedData = parseResumeText(content);

    const resume = await Resume.create({
      userId: req.user!._id,
      originalFilename: req.file.originalname,
      content,
      parsedData,
    });

    res.status(201).json({
      success: true,
      data: resume,
      message: 'Resume uploaded and parsed successfully',
    } satisfies ApiResponse);

    logger.info({ resumeId: resume._id, filename: req.file.originalname }, 'Resume uploaded');
  } catch (err) {
    next(err);
  }
}

export async function listResumes(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }).parse(req.query);

    const filter = { userId: req.user!._id };
    const total = await Resume.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;

    const resumes = await Resume.find(filter, { content: 0 })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(query.limit);

    res.json({
      success: true,
      data: resumes,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      count: resumes.length,
    } as any);
  } catch (err) {
    next(err);
  }
}

export async function getResume(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!resume) throw new NotFoundError('Resume');

    res.json({ success: true, data: resume } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function optimizeResumeHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { jobDescription } = optimizeSchema.parse(req.body);

    const result = await optimizeResume(req.params.id, req.user!._id.toString(), jobDescription);

    res.json({
      success: true,
      data: result,
      message: 'Resume optimized successfully',
    } satisfies ApiResponse);

    logger.info({ resumeId: req.params.id, atsScore: result.optimization.atsScore }, 'Resume optimization completed');
  } catch (err) {
    next(err);
  }
}

export async function exportResume(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!resume) throw new NotFoundError('Resume');

    const { format } = z.object({ format: z.enum(['markdown', 'pdf']).default('markdown') }).parse(req.query);

    if (format === 'markdown') {
      const md = generateResumeMarkdown(resume);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${resume.originalFilename.replace(/\.[^/.]+$/, '')}.md"`);
      res.send(md);
    } else {
      res.json({
        success: true,
        data: { content: resume.content, parsedData: resume.parsedData },
      } satisfies ApiResponse);
    }
  } catch (err) {
    next(err);
  }
}

export async function deleteResume(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!resume) throw new NotFoundError('Resume');

    res.json({
      success: true,
      message: 'Resume deleted successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

function generateResumeMarkdown(resume: any): string {
  const pd = resume.parsedData || {};
  let md = `# ${pd.name || 'Resume'}\n\n`;

  if (pd.email) md += `**Email:** ${pd.email}  \n`;
  if (pd.phone) md += `**Phone:** ${pd.phone}  \n`;

  if (pd.skills?.length) {
    md += '\n## Skills\n\n';
    md += pd.skills.map((s: string) => `- ${s}`).join('\n') + '\n';
  }

  if (pd.experience?.length) {
    md += '\n## Experience\n\n';
    for (const exp of pd.experience) {
      md += `### ${exp.title} at ${exp.company}\n`;
      if (exp.duration) md += `*${exp.duration}*\n`;
      if (exp.description?.length) {
        md += exp.description.map((d: string) => `- ${d}`).join('\n') + '\n';
      }
      md += '\n';
    }
  }

  if (pd.education?.length) {
    md += '## Education\n\n';
    for (const edu of pd.education) {
      md += `- ${edu.degree}${edu.institution ? ` - ${edu.institution}` : ''}${edu.year ? ` (${edu.year})` : ''}\n`;
    }
  }

  return md;
}
