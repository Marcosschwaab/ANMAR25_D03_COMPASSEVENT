export type EventStatus = 'active' | 'inactive';

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  imageUrl: string;
  organizerId: string;
  status: EventStatus;
  createdAt: string;
  updatedAt: string;
}
