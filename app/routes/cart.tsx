import {data, useLoaderData} from 'react-router';
import {CartForm, flattenConnection, type CartReturn} from '@shopify/hydrogen';
import type {Route} from './+types/cart';
import {Container} from '~/components/Container';
import {Eyebrow} from '~/components/Eyebrow';
import {Money} from '~/components/Money';
import {ResponsiveImage} from '~/components/ResponsiveImage';
import {UnderlineLink} from '~/components/UnderlineLink';
import {routeMeta, basicSeo} from '~/lib/seo';

export const meta: Route.MetaFunction = ({data, matches}) =>
  routeMeta(matches, data?.seo);

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;
  const formData = await request.formData();
  const {action: cartAction, inputs} = CartForm.getFormInput(formData);

  if (!cartAction) {
    throw new Error('No cart action provided');
  }

  let result;
  switch (cartAction) {
    case CartForm.ACTIONS.LinesAdd:
      result = await cart.addLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesUpdate:
      result = await cart.updateLines(inputs.lines);
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    default:
      throw new Error(`Cart action "${cartAction}" is not supported`);
  }

  // Persist the cart id back to the session cookie.
  const headers = cart.setCartId(result.cart.id);
  return data(
    {cart: result.cart, errors: result.userErrors},
    {status: 200, headers},
  );
}

export async function loader({context, request}: Route.LoaderArgs) {
  return {
    cart: await context.cart.get(),
    seo: basicSeo({title: 'Cart', request, env: context.env, noIndex: true}),
  };
}

export default function Cart() {
  const {cart} = useLoaderData<typeof loader>();
  // Hydrogen's default cart query returns `lines.edges[].node`;
  // flattenConnection handles both edges and nodes shapes.
  const lines = cart?.lines ? flattenConnection(cart.lines) : [];

  if (!cart || lines.length === 0) {
    return (
      <Container className="section-y">
        <Eyebrow className="block mb-5">Cart</Eyebrow>
        <h1 className="display-h1 text-ink">Your cart is empty</h1>
        <p className="mt-7 text-ash text-[14px] leading-[1.7] font-light max-w-md">
          Nothing here yet. Each piece is sewn to order — begin with the
          collection.
        </p>
        <div className="mt-10">
          <UnderlineLink
            to="/collections"
            staticUnderline
            className="eyebrow text-ink"
          >
            Browse the collection
          </UnderlineLink>
        </div>
      </Container>
    );
  }

  return (
    <Container className="section-y">
      <Eyebrow className="block mb-5">Cart</Eyebrow>
      <h1 className="display-h1 text-ink mb-12">Your cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <ul className="lg:col-span-8 border-t border-hairline">
          {lines.map((line) => (
            <CartLineRow key={line.id} line={line} />
          ))}
        </ul>

        <aside className="lg:col-span-4 lg:sticky lg:top-24 self-start">
          <div className="flex items-baseline justify-between border-b border-hairline pb-5">
            <Eyebrow>Subtotal</Eyebrow>
            <span className="caption text-ink">
              {cart.cost?.subtotalAmount ? (
                <Money money={cart.cost.subtotalAmount} />
              ) : (
                '—'
              )}
            </span>
          </div>
          <p className="caption mt-5 text-ash">
            Shipping and taxes are calculated at checkout.
          </p>
          {cart.checkoutUrl ? (
            <a
              href={cart.checkoutUrl}
              className="arrow-link text-ink mt-8 inline-flex"
            >
              <span>Continue to checkout</span>
              <svg viewBox="0 0 24 1" preserveAspectRatio="none" aria-hidden="true">
                <line
                  x1="0"
                  y1="0.5"
                  x2="24"
                  y2="0.5"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </svg>
            </a>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}

type CartLine = NonNullable<CartReturn>['lines']['nodes'][number];

function CartLineRow({line}: {line: CartLine}) {
  const {merchandise} = line;
  const image = merchandise.image;

  return (
    <li className="grid grid-cols-12 gap-5 py-7 border-b border-hairline">
      <div className="col-span-3 sm:col-span-2">
        {/* 3 of 12 columns (2 from sm) with `gap-5` (20px) gutters, inside the
            8-of-12 lines column — a ~113px thumbnail at most. */}
        <div className="aspect-[4/5] bg-bone overflow-hidden">
          {image ? (
            <ResponsiveImage
              src={image.url}
              alt={image.altText ?? merchandise.product.title}
              aspectRatio="4/5"
              sizes="(min-width: 1320px) 113px, (min-width: 1024px) calc((200vw - 304px) / 18 - 17px), (min-width: 640px) calc((100vw - 268px) / 6 + 20px), calc((100vw - 268px) / 4 + 40px)"
              className="w-full h-full object-cover image-grade"
            />
          ) : null}
        </div>
      </div>

      <div className="col-span-9 sm:col-span-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-[19px] text-ink leading-tight">
            {merchandise.product.title}
          </h2>
          {merchandise.title !== 'Default Title' ? (
            <p className="caption mt-1 text-ash">{merchandise.title}</p>
          ) : null}
          <div className="mt-3">
            <QuantityControls line={line} />
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="caption text-ink">
            <Money money={line.cost.totalAmount} />
          </span>
        </div>
      </div>
    </li>
  );
}

function QuantityControls({line}: {line: CartLine}) {
  const {id, quantity} = line;
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-hairline">
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{lines: [{id, quantity: Math.max(1, quantity - 1)}]}}
        >
          <button
            type="submit"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            className="px-3 py-1.5 text-[14px] text-ink disabled:opacity-40 cursor-pointer"
          >
            −
          </button>
        </CartForm>
        <span className="px-3 text-[13px] tabular-nums text-ink">{quantity}</span>
        <CartForm
          route="/cart"
          action={CartForm.ACTIONS.LinesUpdate}
          inputs={{lines: [{id, quantity: quantity + 1}]}}
        >
          <button
            type="submit"
            aria-label="Increase quantity"
            className="px-3 py-1.5 text-[14px] text-ink cursor-pointer"
          >
            +
          </button>
        </CartForm>
      </div>
      <CartForm
        route="/cart"
        action={CartForm.ACTIONS.LinesRemove}
        inputs={{lineIds: [id]}}
      >
        <button
          type="submit"
          className="eyebrow text-ash hover:text-ink cursor-pointer"
        >
          Remove
        </button>
      </CartForm>
    </div>
  );
}
