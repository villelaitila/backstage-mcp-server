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
import { backstageParamsSerializer } from './params-serializer.js';

describe('backstageParamsSerializer', () => {
  it('returns empty string for empty params', () => {
    expect(backstageParamsSerializer({})).toBe('');
  });

  it('serializes scalar params as key=value', () => {
    const qs = backstageParamsSerializer({ limit: 50, offset: 0 });
    expect(qs).toBe('limit=50&offset=0');
  });

  it('omits undefined and null params', () => {
    const qs = backstageParamsSerializer({ limit: 5, offset: undefined, after: null });
    expect(qs).toBe('limit=5');
  });

  it('serializes a single filter set with a single value as one filter=key=value param', () => {
    const qs = backstageParamsSerializer({ filter: [{ key: 'kind', values: ['component'] }] });
    expect(qs).toBe('filter=kind%3Dcomponent');
  });

  it('serializes a single filter set with multiple values as one comma-joined filter token (OR within key)', () => {
    const qs = backstageParamsSerializer({ filter: [{ key: 'kind', values: ['component', 'api'] }] });
    // OR within a key is expressed as repeated `key=value` pairs comma-joined inside one
    // `filter=` token (canonical Backstage form). The comma is URL-encoded as %2C.
    expect(qs).toBe('filter=kind%3Dcomponent%2Ckind%3Dapi');
  });

  it('serializes multiple filter sets as one comma-joined filter token (AND across keys)', () => {
    const qs = backstageParamsSerializer({
      filter: [
        { key: 'kind', values: ['component'] },
        { key: 'spec.system', values: ['my-system'] },
      ],
    });
    // AND across keys is expressed by comma-joining `key=value` pairs inside ONE `filter=`
    // token (canonical Backstage form, probes 04/25).
    expect(qs).toBe('filter=kind%3Dcomponent%2Cspec.system%3Dmy-system');
  });

  it('mirrors probe 25: kind=component AND relations.consumesApi=api:default/example-api', () => {
    const qs = backstageParamsSerializer({
      filter: [
        { key: 'kind', values: ['component'] },
        { key: 'relations.consumesApi', values: ['api:default/example-api'] },
      ],
    });
    // Expected wire form (probe 25 returned 24 components):
    //   filter=kind=component,relations.consumesApi=api:default/example-api
    expect(qs).toBe(
      'filter=kind%3Dcomponent%2Crelations.consumesApi%3Dapi%3Adefault%2Fexample-api'
    );
  });

  it('combines AND-across-keys with OR-within-key in one filter token', () => {
    const qs = backstageParamsSerializer({
      filter: [
        { key: 'kind', values: ['component', 'api'] },
        { key: 'spec.system', values: ['my-system'] },
      ],
    });
    // Single token: kind=component,kind=api,spec.system=my-system
    expect(qs).toBe('filter=kind%3Dcomponent%2Ckind%3Dapi%2Cspec.system%3Dmy-system');
  });

  it('serializes array params other than filter as repeated key=value tokens', () => {
    const qs = backstageParamsSerializer({ facet: ['kind', 'spec.type'] });
    expect(qs).toBe('facet=kind&facet=spec.type');
  });

  it('serializes orderField array verbatim', () => {
    const qs = backstageParamsSerializer({ orderField: ['asc,metadata.name', 'desc,kind'] });
    expect(qs).toBe('orderField=asc%2Cmetadata.name&orderField=desc%2Ckind');
  });

  it('combines filter array with scalars in stable order', () => {
    const qs = backstageParamsSerializer({
      limit: 2,
      filter: [{ key: 'kind', values: ['component'] }],
      offset: 0,
    });
    // Scalar order follows insertion order of the params object.
    expect(qs).toBe('limit=2&filter=kind%3Dcomponent&offset=0');
  });

  it('encodes spaces and reserved characters in filter values', () => {
    const qs = backstageParamsSerializer({
      filter: [{ key: 'metadata.name', values: ['hello world'] }],
    });
    expect(qs).toBe('filter=metadata.name%3Dhello%20world');
  });
});
