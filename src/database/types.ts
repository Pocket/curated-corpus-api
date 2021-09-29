import { CuratedItem, CuratedStatus } from '@prisma/client';

export type Pagination = {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
};

export type CuratedItemsResult = {
  items: CuratedItem[];
  pagination: Pagination;
};

export type CuratedItemOrderByInput = {
  createdAt?: 'ASC' | 'DESC';
  updatedAt?: 'ASC' | 'DESC';
};

export type CuratedItemFilterInput = {
  url?: string;
  title?: string;
  status?: CuratedStatus;
  language?: string;
};

export type UpdateCuratedItemInput = {
  externalId: string;
  url: string;
  title: string;
  excerpt: string;
  status: CuratedStatus;
  language: string;
  imageUrl?: string;
};
