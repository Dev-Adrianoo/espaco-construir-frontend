export interface Child {
  id: string;
  name: string;
  age: number;
  grade: string;
  classType: string;
  difficulties: string;
  condition: string;
}

export interface Teacher {
  id: number;
  name: string;
}

export interface Student {
  childId: string;
  childName: string;
  guardianId: number;
  booked: boolean;
  scheduleId?: number;
}

export interface ScheduleSlot {
  childId: string;
  childName: string;
  booked: boolean;
  scheduleId?: number;
}

export interface Schedule {
  [date: string]: {
    [time: string]: ScheduleSlot;
  };
}

export interface ApiScheduleResponse {
  id: string;
  startTime: string;
  students: Array<{
    id: string;
    name: string;
  }>;
}

export interface ApiChild {
  id: number;
  name: string;
  age: number;
  grade: string;
  classType: string;
} 