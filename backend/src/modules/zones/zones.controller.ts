import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZonesService } from './zones.service';

@ApiTags('zones')
@Controller('zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all zones' })
  findAll() {
    return this.zonesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by ID' })
  findOne(@Param('id') id: string) {
    return this.zonesService.findOne(id);
  }
}
