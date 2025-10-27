// src/types/report.ts
import { IUser } from './user';
import { IPost } from './post';
import { IComment } from './comment';

export type ReportEntityType = 'post' | 'comment' | 'user';

export type ReportReason = 
    | 'spam'
    | 'harassment'
    | 'hate_speech'
    | 'misinformation'
    | 'inappropriate_content'
    | 'copyright'
    | 'other';

export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';

export interface IReport {
    _id: string;
    reporterId: string | IUser; // User who created the report
    reportedEntityType: ReportEntityType; // 'post', 'comment', or 'user'
    reportedEntityId: string; // ID of the reported entity
    reportedUserId?: string | IUser; // User who owns/created the reported content
    reason: ReportReason;
    description?: string; // Optional detailed description
    status: ReportStatus;
    reviewedBy?: string | IUser; // Admin who reviewed (optional)
    reviewNotes?: string; // Admin's notes on the report
    createdAt: string;
    updatedAt: string;
}

export interface IReportWithDetails extends IReport {
    entityDetails?: IPost | IComment | IUser; // The actual reported entity
}

export interface IReportsResponse {
    reports: IReport[];
    total: number;
}
