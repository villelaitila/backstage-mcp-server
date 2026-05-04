/**
 * Copyright (C) 2025 Robert Lindley
 *
 * This file is part of the project and is licensed under the GNU General Public License v3.0.
 * You may redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import 'reflect-metadata';

import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { Tool } from '../decorators/tool.decorator.js';
import { ApiStatus } from '../types/apis.js';
import { ToolName } from '../types/constants.js';
import { IToolRegistrationContext } from '../types/tools.js';
import { JsonToTextResponse } from '../utils/formatting/responses.js';
import { ToolErrorHandler } from '../utils/tools/tool-error-handler.js';

const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()),
});

const entityOrderSchema = z.object({
  field: z.string(),
  // `order` is required by Backstage's `EntityOrderQuery` (canonical client). Default to 'asc'
  // for callers that omit it, so the schema is forgiving on input but always produces a valid
  // value for the wire layer.
  order: z.enum(['asc', 'desc']).default('asc'),
});

const paramsSchema = z.object({
  filter: z.array(entityFilterSchema).optional(),
  fields: z.array(z.string()).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  // Legacy single-order shape — kept for backwards compatibility with existing callers.
  order: entityOrderSchema.optional(),
  // Canonical shape (matches `@backstage/catalog-client`'s `EntityOrderQuery` array form).
  // Each entry becomes its own `orderField=<order>,<field>` query token.
  orderFields: z.array(entityOrderSchema).optional(),
});

@Tool({
  name: ToolName.GET_ENTITIES_BY_QUERY,
  description: 'Get entities by query filters.',
  paramsSchema,
})
export class GetEntitiesByQueryTool {
  static async execute(
    request: z.infer<typeof paramsSchema>,
    context: IToolRegistrationContext
  ): Promise<CallToolResult> {
    return ToolErrorHandler.executeTool(
      ToolName.GET_ENTITIES_BY_QUERY,
      'queryEntities',
      async (args: z.infer<typeof paramsSchema>, ctx: IToolRegistrationContext) => {
        const result = await ctx.catalogClient.queryEntities(args);
        return JsonToTextResponse({ status: ApiStatus.SUCCESS, data: result });
      },
      request,
      context,
      true
    );
  }
}
