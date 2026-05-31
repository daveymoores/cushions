// Minimal Customer Account API query so codegen has a document to type against.
// Expand (orders, addresses, etc.) when wiring real account pages.
export const CUSTOMER_DETAILS_QUERY = `#graphql
  query CustomerDetails {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
      }
    }
  }
` as const;
