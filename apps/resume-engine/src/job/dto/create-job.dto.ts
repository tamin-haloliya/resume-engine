import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  title!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(800)
  description!: string;

  @Transform(({ value }) => {
    if (!Array.isArray(value)) return;
    return [
      ...new Set(
        value
          .filter((skill) => typeof skill === 'string')
          .map((skill) => skill.trim().toLowerCase())
          .filter((skill) => skill.length > 0),
      ),
    ];
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  requiredSkills!: string[];
}
