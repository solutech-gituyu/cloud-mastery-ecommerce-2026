"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getProducts } from "../../../api";
import { ProductType } from "../../../types/ProductType";
import { useShop } from "../../ShopProvider";

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
    `https://placehold.co/800x600/png?text=${encodeURIComponent(product.name || "Product")}`;

  const normalizedUrl = normalizeImageUrl(rawUrl);

  return normalizedUrl.includes("placehold.co/") && !normalizedUrl.includes("/png?")
    ? normalizedUrl.replace(/\/(\d+x\d+)\?/, "/$1/png?")
    : normalizedUrl;
};

const getEstimatedRating = (product: ProductType) => {
  const source = `${product.id}-${product.name}`;
  const hash = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (3.5 + (hash % 16) / 10).toFixed(1);
};

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id ? decodeURIComponent(params.id) : "";

  const { addToCart } = useShop();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      try {
        const response = await getProducts();
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        const found = list.find((item: ProductType) => String(item.id) === String(productId));
        setProduct(found || null);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const isOutOfStock = useMemo(() => (product ? product.quantity <= 0 : true), [product]);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
        Loading product details...
      </section>
    );
  }

  if (!product) {
    return (
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-slate-900">Product not found</h1>
        <p className="text-sm text-slate-600">
          The product you selected is unavailable or may have been removed.
        </p>
        <Link
          href="/shop/products"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Back to Products
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/shop" className="transition hover:text-slate-800">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop/products" className="transition hover:text-slate-800">
          Products
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-700">{product.name}</span>
      </div>

      <article className="grid gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.1fr_1fr] lg:p-8">
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 md:min-h-[420px]">
          <Image
            src={getProductImage(product)}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
            className="object-cover"
          />
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              {product.category || "Uncategorized"}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {product.name}
            </h1>
          </div>

          <p className="text-3xl font-bold text-slate-900">
            KES {Number(product.unitCost).toLocaleString()}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-slate-500">Availability</p>
              <p className={`mt-1 font-semibold ${isOutOfStock ? "text-rose-600" : "text-emerald-600"}`}>
                {isOutOfStock ? "Out of stock" : "In stock"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-slate-500">Units available</p>
              <p className="mt-1 font-semibold text-slate-900">{product.quantity}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-slate-500">Estimated rating</p>
              <p className="mt-1 font-semibold text-slate-900">{getEstimatedRating(product)} / 5</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-slate-500">Product ID</p>
              <p className="mt-1 font-semibold text-slate-900">{product.id}</p>
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => {
              addToCart(product);
              toast.success(`${product.name} added to cart`);
            }}
            className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>

          <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Product Notes</p>
            <p className="mt-1">
              This item is from your live products dataset. Pricing and stock values are shown in real time from the products API.
            </p>
            {product.createdAt ? (
              <p className="mt-2 text-xs text-slate-500">
                Added on {new Date(product.createdAt).toLocaleDateString()}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    </section>
  );
}
