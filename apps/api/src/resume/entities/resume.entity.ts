import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExtractedResumeData } from '../interfaces/extracted-resume-data';

export enum Status {
  PENDING = 'pending',
  PARSED = 'parsed',
  FAILED = 'failed',
}

@Entity('resumes')
export class Resume {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalFilename!: string;

  @Column({ type: 'enum', enum: Status, default: Status.PENDING })
  status!: Status;

  @Column({ type: 'jsonb', nullable: true })
  extractedData!: ExtractedResumeData | null;

  @Column({ type: 'text', nullable: true })
  rawData!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
