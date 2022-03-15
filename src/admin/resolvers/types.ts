import {
  ApprovedItem,
  CuratedStatus,
  ScheduledItem as ScheduledItemModel,
} from '@prisma/client';
import { CorpusItemSource } from '../../shared/types';

export type ImportApprovedCuratedCorpusItemPayload = {
  approvedItem: ApprovedItem;
  scheduledItem?: ScheduledItemModel;
};

export type ImportApprovedCuratedCorpusItemInput = {
  url: string;
  title: string;
  excerpt: string;
  status: CuratedStatus;
  language: string;
  publisher: string;
  imageUrl: string;
  topic: string;
  source: CorpusItemSource;
  isCollection: boolean;
  isSyndicated: boolean;
  createdAt: number;
  createdBy: string;
  updatedAt: number;
  updatedBy: string;
  scheduledDate: string;
  scheduledSurfaceGuid: string;
};
