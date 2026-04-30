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
import { entityFilterSchema } from './filter.schema.js';

describe('entityFilterSchema', () => {
  it('accepts a filter set with a non-empty values array', () => {
    const result = entityFilterSchema.safeParse({ key: 'kind', values: ['component'] });
    expect(result.success).toBe(true);
  });

  it('accepts a filter set with multiple values', () => {
    const result = entityFilterSchema.safeParse({ key: 'kind', values: ['component', 'api'] });
    expect(result.success).toBe(true);
  });

  it('rejects a filter set whose values array is empty', () => {
    const result = entityFilterSchema.safeParse({ key: 'kind', values: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join('.') === 'values');
      expect(issue).toBeDefined();
    }
  });

  it('rejects a filter set with a missing key', () => {
    const result = entityFilterSchema.safeParse({ values: ['component'] });
    expect(result.success).toBe(false);
  });

  it('rejects a filter set whose values are not strings', () => {
    const result = entityFilterSchema.safeParse({ key: 'kind', values: [42] });
    expect(result.success).toBe(false);
  });
});
