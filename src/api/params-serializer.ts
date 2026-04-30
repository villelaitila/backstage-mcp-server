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

/**
 * Backstage's Catalog API expects a non-standard query-string shape for the `filter`
 * parameter: each filter is a `filter=key=value` pair, repeated for OR semantics
 * (probe 04). Axios's default serializer would emit `filter[0][key]=...&filter[0][values][]=...`
 * which Backstage rejects.
 *
 * Other array params (`facet`, `orderField`, `fields`) are emitted as plain repeated
 * `key=value` tokens. Scalar params are emitted as `key=value` in insertion order.
 *
 * Input filter shape: `Array<{ key: string, values: string[] }>`.
 *   - One value      → `filter=key=value`
 *   - Multiple values → `filter=key=v1&filter=key=v2` (OR within key, per probe 04)
 *   - Multiple sets   → `filter=k1=v1&filter=k2=v2` (OR across sets)
 */
export interface BackstageFilterSet {
  key: string;
  values: string[];
}

type ParamsRecord = Record<string, unknown>;

const isFilterSet = (value: unknown): value is BackstageFilterSet => {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.key === 'string' && Array.isArray(v.values) && v.values.every((x) => typeof x === 'string');
};

const isFilterArray = (value: unknown): value is BackstageFilterSet[] =>
  Array.isArray(value) && value.every(isFilterSet);

const encode = (s: string): string => encodeURIComponent(s);

const serializeFilter = (filters: BackstageFilterSet[]): string[] => {
  const tokens: string[] = [];
  for (const set of filters) {
    for (const v of set.values) {
      tokens.push(`filter=${encode(`${set.key}=${v}`)}`);
    }
  }
  return tokens;
};

const serializeArrayParam = (key: string, arr: unknown[]): string[] =>
  arr.filter((v) => v !== undefined && v !== null).map((v) => `${encode(key)}=${encode(String(v))}`);

const serializeScalarParam = (key: string, value: unknown): string =>
  `${encode(key)}=${encode(typeof value === 'string' ? value : String(value))}`;

export const backstageParamsSerializer = (params: ParamsRecord | undefined | null): string => {
  if (!params) return '';
  const tokens: string[] = [];
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    if (key === 'filter' && isFilterArray(raw)) {
      tokens.push(...serializeFilter(raw));
      continue;
    }
    if (Array.isArray(raw)) {
      tokens.push(...serializeArrayParam(key, raw));
      continue;
    }
    tokens.push(serializeScalarParam(key, raw));
  }
  return tokens.join('&');
};
