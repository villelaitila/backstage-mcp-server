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
 * parameter. The canonical wire form (probes 04/25) is comma-joined `key=value` pairs
 * inside a single `filter=` token; comma is the AND-joining operator. Axios's default
 * serializer would emit `filter[0][key]=...&filter[0][values][]=...` which Backstage
 * rejects.
 *
 * Other array params (`facet`, `orderField`, `fields`) are emitted as plain repeated
 * `key=value` tokens. Scalar params are emitted as `key=value` in insertion order.
 *
 * Input filter shape: `Array<{ key: string, values: string[] }>` collapses to a single
 * comma-joined `filter=` token (one HTTP filter set):
 *   - Outer array entries  → AND across keys (`k1=v1,k2=v2`)
 *   - Inner `values` items → OR within a key (`k1=v1,k1=v2`) — comma-joined in the same token
 *
 * Examples:
 *   `[{kind:[component]}]`                     → `filter=kind=component`
 *   `[{kind:[component, api]}]`                → `filter=kind=component,kind=api`
 *   `[{kind:[component]},{spec.system:[my-system]}]`
 *                                              → `filter=kind=component,spec.system=my-system`
 *   `[{kind:[component]},{relations.consumesApi:[api:default/example-api]}]`
 *                                              → `filter=kind=component,relations.consumesApi=api:default/example-api`
 *
 * Top-level OR (across filter sets) is intentionally not expressible by the input
 * model; see Strategist Δψ-1 analysis for the rationale (Option 1).
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
  // Collapse the entire filter input to a single comma-joined `filter=` token.
  // Outer items AND-join across keys; inner `values` OR-join within a key.
  // Each `key=value` pair is URL-encoded individually before being joined by
  // an unencoded literal `,` and then the whole token (including commas) is
  // emitted as one query parameter — i.e., commas are the separator between
  // pairs and are URL-encoded as %2C by being part of the encoded value passed
  // to axios's URL assembler.
  const pairs: string[] = [];
  for (const set of filters) {
    for (const v of set.values) {
      pairs.push(encode(`${set.key}=${v}`));
    }
  }
  if (pairs.length === 0) return [];
  return [`filter=${pairs.join(encode(','))}`];
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
