import { ApiProperty } from '@nestjs/swagger';

export class PaginationMeta {
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class PaginatedDto<T> {
  data: T[];
  meta: PaginationMeta;
}
