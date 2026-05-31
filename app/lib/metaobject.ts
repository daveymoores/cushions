/**
 * Helpers for reading Shopify Metaobjects (Settings → Custom data → Metaobjects).
 *
 * Metaobject fields come back as a generic list of {key, value, reference}.
 * `value` holds text/number values; `reference` resolves file/image fields.
 * These helpers map a raw node into a typed shape the UI can render.
 *
 * Example below is for a metaobject type `material` with fields:
 *   - name        (single line text)
 *   - description (multi line text)
 *   - image       (file — image)  [optional]
 */
import type {MetaobjectsQuery} from 'storefrontapi.generated';
import type {ImageT} from '~/lib/mock-data';

type MetaobjectNode = MetaobjectsQuery['metaobjects']['nodes'][number];
type MetaobjectField = MetaobjectNode['fields'][number];

export type MaterialContent = {
  id: string;
  handle: string;
  name: string;
  description: string;
  image: ImageT | null;
};

function imageFromReference(field: MetaobjectField | undefined): ImageT | null {
  const ref = field?.reference;
  if (!ref || !('image' in ref) || !ref.image) return null;
  const img = ref.image;
  return {
    id: img.id ?? img.url,
    url: img.url,
    altText: img.altText ?? null,
    width: img.width ?? 0,
    height: img.height ?? 0,
  };
}

export function toMaterial(node: MetaobjectNode): MaterialContent {
  const fields = new Map(node.fields.map((f) => [f.key, f]));
  return {
    id: node.id,
    handle: node.handle,
    name: fields.get('name')?.value ?? node.handle,
    description: fields.get('description')?.value ?? '',
    image: imageFromReference(fields.get('image')),
  };
}
