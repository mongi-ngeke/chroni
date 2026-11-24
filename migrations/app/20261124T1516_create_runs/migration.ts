#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/444401844d52f353b4d9115f80c0d1b04a64d232f2d846943bd6ef35e93c3ea0/contract';
import startContract from '../../snapshots/444401844d52f353b4d9115f80c0d1b04a64d232f2d846943bd6ef35e93c3ea0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/444761c06bb0c698252de4a0c47cfacd102ccc7a672d80ecb1ab1742bf5e1341/contract';
import endContract from '../../snapshots/444761c06bb0c698252de4a0c47cfacd102ccc7a672d80ecb1ab1742bf5e1341/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'Run',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('Run_status_check_97469d4c', sql`"status" IN ('in_progress', 'won')`),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'RunCard',
        columns: [
          col('cardId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('runId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('zone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['runId', 'cardId']),
          checkExpression(
            'RunCard_zone_check_677dc65a',
            sql`"zone" IN ('timeline', 'hand', 'draw_pile', 'discard')`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'RunCard',
        constraint: 'RunCard_runId_zone_position_key',
        columns: ['runId', 'zone', 'position'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RunCard',
        index: 'RunCard_cardId_idx_c511c1e1',
        columns: ['cardId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'RunCard',
        index: 'RunCard_runId_idx_a6016437',
        columns: ['runId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RunCard',
        foreignKey: {
          name: 'RunCard_runId_fkey',
          columns: ['runId'],
          references: { schema: 'public', table: 'Run', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'RunCard',
        foreignKey: {
          name: 'RunCard_cardId_fkey',
          columns: ['cardId'],
          references: { schema: 'public', table: 'Card', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
