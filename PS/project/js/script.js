const productGrid = document.getElementById("productGrid");
const cartItemsContainer = document.getElementById("cartItems");
const totalItemsElement = document.getElementById("totalItems");
const totalPriceElement = document.getElementById("totalPrice");
const cartCountBadge = document.getElementById("cartCountBadge");
const checkoutBtn = document.getElementById("checkoutBtn");
const toast = document.getElementById("toast");

const APP_VERSION = "v8";
const STORAGE_KEY = `cartData_${APP_VERSION}`;

function imageUrl(fileName) {
	// Use direct browser path URLs for product images.
	return `/assets/images/${fileName}`;
}

const fallbackImage = imageUrl("image-not-found.png");

const products = [
	{ id: 1, name: "Kurkure Masala Munch", price: 20, image: imageUrl("product-kurkure.png") },
	{ id: 2, name: "Bingo Mad Angles", price: 30, image: imageUrl("product-bingo.png") },
	{ id: 3, name: "Haldiram Aloo Bhujia", price: 55, image: imageUrl("product-haldiram.png") },
	{ id: 4, name: "Uncle Chips Spicy Treat", price: 25, image: imageUrl("product-unclechips.png") },
	{ id: 5, name: "Too Yumm Multigrain Chips", price: 40, image: imageUrl("product-tooyumm.png") },
];

let cart = loadCart();

function formatCurrency(amount) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 2,
	}).format(amount);
}

function showToast(message) {
	if (!toast) {
		return;
	}

	toast.innerHTML = `<div class="toast-box">${message}</div>`;
	toast.classList.add("show-toast");

	setTimeout(() => {
		toast.classList.remove("show-toast");
	}, 1500);
}

function saveCart() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function loadCart() {
	const raw = localStorage.getItem(STORAGE_KEY);

	if (!raw) {
		return [];
	}

	try {
		const parsed = JSON.parse(raw);

		if (!Array.isArray(parsed)) {
			return [];
		}

		return parsed
			.map((entry) => {
				if (!entry || typeof entry.id !== "number" || typeof entry.quantity !== "number") {
					return null;
				}

				const product = products.find((item) => item.id === entry.id);

				if (!product) {
					return null;
				}

				return {
					id: product.id,
					name: product.name,
					price: product.price,
					image: product.image,
					quantity: Math.max(1, entry.quantity),
				};
			})
			.filter(Boolean);
	} catch (error) {
		console.error("Invalid cart data in localStorage:", error);
		return [];
	}
}

function calculateTotals() {
	return cart.reduce(
		(acc, item) => {
			acc.items += item.quantity;
			acc.price += item.quantity * item.price;
			return acc;
		},
		{ items: 0, price: 0 }
	);
}

function renderProducts() {
	if (!productGrid) {
		return;
	}

	productGrid.innerHTML = "";

	products.forEach((product) => {
		const inCart = cart.some((item) => item.id === product.id);

		const card = document.createElement("article");
		card.className = "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";

		card.innerHTML = `
			<div class="h-44 bg-slate-100">
				<div
					role="img"
					aria-label="${product.name}"
					class="product-image h-full w-full"
					style="background-image: url('${product.image}'), url('${fallbackImage}');"
				></div>
			</div>
			<div class="p-4">
				<h3 class="font-semibold">${product.name}</h3>
				<p class="mt-1 text-lg font-bold">${formatCurrency(product.price)}</p>
				<button
					type="button"
					data-id="${product.id}"
					class="add-btn mt-4 w-full rounded-md py-2 text-sm font-semibold ${
						inCart ? "border border-green-200 bg-green-100 text-green-700" : "bg-slate-900 text-white hover:bg-slate-800"
					}"
					${inCart ? "disabled" : ""}
				>
					${inCart ? "Added" : "Add to Cart"}
				</button>
			</div>
		`;

		productGrid.appendChild(card);
	});
}

function renderCart() {
	if (!cartItemsContainer || !totalItemsElement || !totalPriceElement || !cartCountBadge || !checkoutBtn) {
		return;
	}

	cartItemsContainer.innerHTML = "";

	if (cart.length === 0) {
		cartItemsContainer.innerHTML = `
			<div class="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-600">
				Your cart is empty.
			</div>
		`;
	} else {
		cart.forEach((item) => {
			const row = document.createElement("article");
			row.className = "rounded-lg border border-slate-200 bg-white p-3";

			row.innerHTML = `
				<div class="flex gap-3">
					<div
						role="img"
						aria-label="${item.name}"
						class="cart-thumb h-16 w-16 rounded-lg"
						style="background-image: url('${item.image}'), url('${fallbackImage}');"
					></div>
					<div class="flex-1">
						<div class="flex items-start justify-between gap-2">
							<h3 class="text-sm font-semibold">${item.name}</h3>
							<button type="button" data-id="${item.id}" class="remove-btn text-xs font-semibold text-red-500">Remove</button>
						</div>
						<p class="mt-1 text-sm text-slate-600">${formatCurrency(item.price)}</p>
						<div class="mt-2 inline-flex items-center overflow-hidden rounded-md border border-slate-300">
							<button type="button" data-id="${item.id}" data-action="decrease" class="qty-btn px-3 py-1 text-sm hover:bg-slate-100">-</button>
							<span class="px-3 py-1 text-sm font-semibold">${item.quantity}</span>
							<button type="button" data-id="${item.id}" data-action="increase" class="qty-btn px-3 py-1 text-sm hover:bg-slate-100">+</button>
						</div>
					</div>
				</div>
			`;

			cartItemsContainer.appendChild(row);
		});
	}

	const summary = calculateTotals();
	totalItemsElement.textContent = String(summary.items);
	cartCountBadge.textContent = String(summary.items);
	totalPriceElement.textContent = formatCurrency(summary.price);
	checkoutBtn.disabled = summary.items === 0;
}

function addToCart(productId) {
	const product = products.find((item) => item.id === productId);

	if (!product) {
		return;
	}

	const existing = cart.find((item) => item.id === productId);

	if (existing) {
		existing.quantity += 1;
		showToast("Quantity updated");
	} else {
		cart.push({ ...product, quantity: 1 });
		showToast("Item added");
	}

	saveCart();
	renderProducts();
	renderCart();
}

function updateQuantity(productId, action) {
	const item = cart.find((entry) => entry.id === productId);

	if (!item) {
		return;
	}

	if (action === "increase") {
		item.quantity += 1;
	}

	if (action === "decrease") {
		item.quantity -= 1;
	}

	if (item.quantity <= 0) {
		cart = cart.filter((entry) => entry.id !== productId);
	}

	saveCart();
	renderProducts();
	renderCart();
}

function removeItem(productId) {
	cart = cart.filter((item) => item.id !== productId);
	saveCart();
	renderProducts();
	renderCart();
	showToast("Item removed");
}

function bindEvents() {
	if (productGrid) {
		productGrid.addEventListener("click", (event) => {
			const button = event.target.closest(".add-btn");

			if (!button) {
				return;
			}

			addToCart(Number(button.dataset.id));
		});
	}

	if (cartItemsContainer) {
		cartItemsContainer.addEventListener("click", (event) => {
			const qtyButton = event.target.closest(".qty-btn");

			if (qtyButton) {
				updateQuantity(Number(qtyButton.dataset.id), qtyButton.dataset.action);
				return;
			}

			const removeButton = event.target.closest(".remove-btn");

			if (removeButton) {
				removeItem(Number(removeButton.dataset.id));
			}
		});
	}

	if (checkoutBtn) {
		checkoutBtn.addEventListener("click", () => {
			showToast("Demo checkout complete");
		});
	}
}

bindEvents();
renderProducts();
renderCart();
