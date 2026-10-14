import { Types } from 'mongoose';
import { CmsPage, CmsPageDocument, CmsNotice, CmsNoticeDocument } from './cms.model.js';
import { School } from '../schools/school.model.js';
import { CreateCmsPageInput, CreateCmsNoticeInput } from '@smart-school/validation';
import { AppError } from '../../utils/appError.js';

export class CmsService {
  // Public website access
  async getPublicSchoolSite(schoolSlug: string) {
    const school = await School.findOne({
      $or: [{ slug: schoolSlug.toLowerCase() }, { 'customDomain.domain': schoolSlug.toLowerCase() }],
      status: 'active',
    });

    if (!school) {
      throw AppError.notFound('School website not found or inactive');
    }

    let pages: any[] = await CmsPage.find({ schoolId: school._id, isPublished: true }).sort({ order: 1 });
    const notices = await CmsNotice.find({ schoolId: school._id, isPublished: true }).sort({ date: -1 }).limit(10);

    if (pages.length === 0) {
      pages = await this.seedDefaultPages(school.id);
    }

    return {
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        branding: school.branding,
        contactEmail: school.contactEmail,
        contactPhone: school.contactPhone,
        address: school.address,
      },
      pages,
      notices,
    };
  }

  // Admin page management
  async listPages(schoolId: string): Promise<any[]> {
    let pages: any[] = await CmsPage.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ order: 1 });
    if (pages.length === 0) {
      // Seed initial default pages for this school
      pages = await this.seedDefaultPages(schoolId);
    }
    return pages;
  }

  async seedDefaultPages(schoolId: string): Promise<CmsPageDocument[]> {
    const school = await School.findById(schoolId);
    const schoolName = school?.name || 'TENORA365 School';

    const defaults = [
      {
        slug: 'home',
        title: `Welcome to ${schoolName}`,
        content: `<h3>Empowering Students for Tomorrow</h3><p>At ${schoolName}, we offer world-class holistic education rooted in academic rigor, ethical values, and digital excellence.</p>`,
        order: 1,
        isPublished: true,
      },
      {
        slug: 'about',
        title: 'About Our Institution',
        content: `<p>${schoolName} is dedicated to fostering curious minds, dynamic leadership, and community responsibility with state-of-the-art campus facilities.</p>`,
        order: 2,
        isPublished: true,
      },
      {
        slug: 'academics',
        title: 'Academic Curriculum & Pedagogy',
        content: `<p>Our comprehensive curriculum integrates STEM education, language development, arts, and athletic development designed for holistic growth.</p>`,
        order: 3,
        isPublished: true,
      },
      {
        slug: 'admissions',
        title: 'Admissions Open for Academic Session',
        content: `<p>Admissions are now open. Prospective parents can register enquiries online or visit our campus for an interactive orientation.</p>`,
        order: 4,
        isPublished: true,
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        content: `<p>Visit our campus or contact our administration office for queries regarding enrollment, academics, and activities.</p>`,
        order: 5,
        isPublished: true,
      },
    ];

    const created: CmsPageDocument[] = [];
    for (const d of defaults) {
      const page = await CmsPage.create({
        ...d,
        schoolId: new Types.ObjectId(schoolId),
      });
      created.push(page);
    }
    return created;
  }

  async createPage(schoolId: string, input: CreateCmsPageInput): Promise<CmsPageDocument> {
    const existing = await CmsPage.findOne({
      schoolId: new Types.ObjectId(schoolId),
      slug: input.slug.trim().toLowerCase(),
    });

    if (existing) {
      throw AppError.conflict(`Page with URL slug '${input.slug}' already exists.`);
    }

    const page = new CmsPage({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      slug: input.slug.trim().toLowerCase(),
    });

    await page.save();
    return page;
  }

  async updatePage(schoolId: string, id: string, input: Partial<CreateCmsPageInput>): Promise<CmsPageDocument> {
    const page = await CmsPage.findOne({
      _id: new Types.ObjectId(id),
      schoolId: new Types.ObjectId(schoolId),
    });

    if (!page) throw AppError.notFound('Page not found');

    if (input.title !== undefined) page.title = input.title;
    if (input.content !== undefined) page.content = input.content;
    if (input.bannerImageUrl !== undefined) page.bannerImageUrl = input.bannerImageUrl;
    if (input.isPublished !== undefined) page.isPublished = input.isPublished;
    if (input.seoTitle !== undefined) page.seoTitle = input.seoTitle;
    if (input.seoDescription !== undefined) page.seoDescription = input.seoDescription;
    if (input.order !== undefined) page.order = input.order;

    await page.save();
    return page;
  }

  // Admin notices
  async listNotices(schoolId: string): Promise<CmsNoticeDocument[]> {
    return CmsNotice.find({ schoolId: new Types.ObjectId(schoolId) }).sort({ date: -1 });
  }

  async createNotice(schoolId: string, input: CreateCmsNoticeInput): Promise<CmsNoticeDocument> {
    const notice = new CmsNotice({
      ...input,
      schoolId: new Types.ObjectId(schoolId),
      date: new Date(input.date),
    });

    await notice.save();
    return notice;
  }
}

export const cmsService = new CmsService();
