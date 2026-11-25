#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/444761c06bb0c698252de4a0c47cfacd102ccc7a672d80ecb1ab1742bf5e1341/contract';
import startContract from '../../snapshots/444761c06bb0c698252de4a0c47cfacd102ccc7a672d80ecb1ab1742bf5e1341/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b00c6d4be4b746e5a3d7dac936f33851122d7b5542fcbd58d4d3d608f172513e/contract';
import endContract from '../../snapshots/b00c6d4be4b746e5a3d7dac936f33851122d7b5542fcbd58d4d3d608f172513e/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Card',
        column: 'description',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Card',
        column: 'imageAlt',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Card',
        column: 'imageCredit',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Card',
        column: 'imageUrl',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
