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
import { z } from 'zod';

/**
 * Shared Zod schema for a single Backstage Catalog filter set.
 *
 * Wire semantics (see `src/api/params-serializer.ts`): the outer `filter` array
 * AND-joins entries across keys; `values` OR-joins within a single key. An empty
 * `values` array is rejected as a caller error — a filter set with no values has
 * no meaningful wire form and would silently emit nothing.
 */
export const entityFilterSchema = z.object({
  key: z.string(),
  values: z.array(z.string()).min(1),
});

export type EntityFilter = z.infer<typeof entityFilterSchema>;
