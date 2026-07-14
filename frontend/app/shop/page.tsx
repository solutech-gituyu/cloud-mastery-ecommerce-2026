import Image from "next/image";
import Link from "next/link";
import { API_URL } from "../api";
import { ProductType } from "../types/ProductType";

const MAX_LATEST_FINDS = 4;

const slugifyCategory = (value: string) =>
  value.toLowerCase().replace(/ & /g, "-").replace(/\s+/g, "-");

const normalizeImageUrl = (url: string) => {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === "storage.cloud.google.com") {
      parsed.hostname = "storage.googleapis.com";
    }

    if (parsed.hostname === "storage.googleapis.com") {
      parsed.pathname = decodeURIComponent(parsed.pathname);
    }

    return parsed.toString();
  } catch {
    return url;
  }
};

const getProductImage = (product: ProductType) => {
  const rawUrl =
    product.imageUrl ||
    product.image ||
    `https://placehold.co/600x400/png?text=${encodeURIComponent(product.name || "Product")}`;

  const normalizedUrl = normalizeImageUrl(rawUrl);

  return normalizedUrl.includes("placehold.co/") && !normalizedUrl.includes("/png?")
    ? normalizedUrl.replace(/\/(\d+x\d+)\?/, "/$1/png?")
    : normalizedUrl;
};

const shuffleProducts = (products: ProductType[]) => {
  const shuffled = [...products];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

async function fetchProducts(): Promise<ProductType[]> {
  try {
    const response = await fetch(`${API_URL}/products`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return Array.isArray(payload) ? payload : [];
  } catch {
    return [];
  }
}

export default async function ShopHome() {
  const products = await fetchProducts();
  const categories = Array.from(
    new Set(products.map((product) => product.category || "Uncategorized"))
  );
  const latestFinds = shuffleProducts(products).slice(0, MAX_LATEST_FINDS);
  const categoryPreviewImageByName = new Map<string, string>();

  products.forEach((product) => {
    const category = product.category || "Uncategorized";
    if (!categoryPreviewImageByName.has(category)) {
      categoryPreviewImageByName.set(category, getProductImage(product));
    }
  });

  return (
    <>
      <section className="space-y-16 pb-16">
        {/* Hero Section */}
        <div className="overflow-hidden rounded-3xl border border-amber-200 bg-[linear-gradient(120deg,#fff3cc_0%,#ffe8df_45%,#eaf4ff_100%)] p-8 shadow-sm md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="mb-3 inline-block rounded-full bg-white px-3 py-1 text-xs font-bold tracking-wide text-amber-700">
                CUSTOMER STORE
              </p>
              <h1 className="max-w-xl text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
                Fresh picks for every room in your home.
              </h1>
              <p className="mt-4 max-w-2xl text-base text-slate-700 md:text-lg">
                Discover products by category, add items to cart, and run through a
                smooth mock checkout experience.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop/products"
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Browse Products
                </Link>
                <Link
                  href="/shop/orders"
                  className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-900"
                >
                  View Ordered Items
                </Link>
              </div>
            </div>

            <div className="relative mx-auto h-64 w-full max-w-md overflow-hidden rounded-2xl border border-amber-100 bg-white/70 shadow-sm md:h-72">
              <Image
                src="/mastery_commerce.png"
                alt="Cloud Mastery Commerce"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>

        {/* Categories Row */}

        <div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/shop/products?category=${encodeURIComponent(
                  slugifyCategory(category)
                )}`}
                className="group relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-sm transition hover:shadow-md"
              >
                <img
                  src={
                    categoryPreviewImageByName.get(category) ||
                    `https://placehold.co/600x600/png?text=${encodeURIComponent(category)}`
                  }
                  alt={category}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                <h3 className="absolute bottom-4 left-4 text-base font-serif tracking-wide text-white md:bottom-5 md:left-5 md:text-lg">
                  {category}
                </h3>
              </Link>
            ))}
          </div>
        </div>

        {/* Latest Finds Section */}
        <div>
          <div className="mb-6 flex items-baseline justify-between border-b border-slate-100 pb-4">
            <h2 className="text-3xl font-serif text-[#4a3b32]">Latest Finds</h2>
            <Link
              href="/shop/products"
              className="flex items-center gap-1 text-sm font-semibold text-slate-800 transition hover:text-slate-600"
            >
              View All <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          {latestFinds.length > 0 ? (
            <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {latestFinds.map((product) => (
                <Link
                  key={product.id}
                  href={`/shop/products/${encodeURIComponent(product.id)}`}
                  className="group block cursor-pointer"
                >
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-stone-100">
                    <div className="absolute left-3 top-3 z-10 rounded-full bg-[#e8efe6] px-3 py-1 text-xs font-semibold text-[#5a7054]">
                      New
                    </div>
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{product.category || "Uncategorized"}</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    KES {Number(product.unitCost).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
              No products available yet.
            </p>
          )}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="w-full bg-[#eeeae6] py-12 px-6 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 md:flex-row">
          
          {/* Left Text */}
          <div className="max-w-xs">
            <h2 className="text-xl font-serif font-medium text-[#4a3b32]">
              Soko Marketplace
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              &copy; 2026 Soko Marketplace. The curated marketplace for everything you love.
            </p>
          </div>

          {/* Right Links Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-slate-600 sm:grid-cols-3 md:text-right">
            
            <div className="flex flex-col space-y-3">
              <Link href="#" className="hover:text-slate-900">Appliances</Link>
              <Link href="#" className="hover:text-slate-900">Clothing</Link>
              <Link href="#" className="hover:text-slate-900">Health & Beauty</Link>
              <Link href="#" className="hover:text-slate-900">Toys</Link>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link href="#" className="hover:text-slate-900">Automotive</Link>
              <Link href="#" className="hover:text-slate-900">Electronics</Link>
              <Link href="#" className="hover:text-slate-900">Home & Garden</Link>
              <Link href="#" className="hover:text-slate-900">Privacy Policy</Link>
            </div>
            
            <div className="flex flex-col space-y-3">
              <Link href="#" className="hover:text-slate-900">Books</Link>
              <Link href="#" className="hover:text-slate-900">Furniture</Link>
              <Link href="#" className="hover:text-slate-900">Sports</Link>
              <Link href="#" className="hover:text-slate-900">Contact Us</Link>
            </div>

          </div>
        </div>
      </footer>
    </>
  );
}