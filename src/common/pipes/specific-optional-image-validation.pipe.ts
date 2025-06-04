import { Injectable } from '@nestjs/common';
import { ParseFilePipe, FileTypeValidator } from '@nestjs/common';

@Injectable()
export class SpecificOptionalImageValidationPipe extends ParseFilePipe {
  constructor() {
    super({
      validators: [
        new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
      ],
      fileIsRequired: false,
    });
  }
}