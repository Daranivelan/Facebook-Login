function checkLogin() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");
  if (!isLoggedIn) {
    window.location.href = "index.html";
  }
}

/**
 * Handle login form submission
 * @param {Event} event
 */
function handleLogin(event) {
  event.preventDefault(); // Prevent form from submitting

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // Retrieve users from localStorage
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Find user with matching credentials
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    localStorage.setItem("isLoggedIn", "true");
    window.location.href = "main.html";
  } else {
    alert("Invalid username or password.");
  }
}
FB.api("/me", { fields: "name,email" }, function (response) {
  localStorage.setItem("fbUser", JSON.stringify(response));
  window.location.href = "main.html";
});

function checkLoginState() {
  function checkLoginState() {
    FB.getLoginStatus(function (response) {
      if (response.status === "connected") {
        // If the user is logged in, redirect to another page
        FB.api("/me", { fields: "name,email" }, function (response) {
          localStorage.setItem("fbUser", JSON.stringify(response));
          window.location.href = "main.html"; // Change this to your desired page
        });
      } else {
        console.log("User not authenticated");
      }
    });
  }
}
/**
 * Handle sign-up form submission
 * @param {Event} event
 */
function handleSignUp(event) {
  event.preventDefault(); // Prevent form from submitting

  const username = document.getElementById("signup-username").value.trim();
  const password = document.getElementById("signup-password").value.trim();
  const confirmPassword = document
    .getElementById("signup-confirm-password")
    .value.trim();

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  // Retrieve existing users from localStorage
  const users = JSON.parse(localStorage.getItem("users")) || [];

  // Check if username already exists
  const userExists = users.some((user) => user.username === username);

  if (userExists) {
    alert("Username already taken. Please choose another one.");
    return;
  }

  // Add new user to users array
  users.push({ username, password });

  // Save updated users array to localStorage
  localStorage.setItem("users", JSON.stringify(users));

  alert("Registration successful! You can now log in.");
  window.location.href = "index.html";
}

/**
 * Handle logout
 * Clears login status and redirects to login page
 */
function handleLogout() {
  localStorage.removeItem("isLoggedIn");
  window.location.href = "index.html";
}

// ============================
// Product Functions
// ============================

let products = [];
const productsCount = {};

/**
 * Fetch products from the API
 */
const fetchProducts = async () => {
  try {
    const response = await fetch("https://fakestoreapi.com/products");
    products = await response.json();
    console.log("Fetched Products:", products); // Debugging line
    displayProductsAndCategories(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    const productsDiv = document.getElementById("products");
    if (productsDiv) {
      productsDiv.innerHTML = `<p style="color: white; text-align: center; width: 100%;">Failed to load products. Please try again later.</p>`;
    }
  }
};

/**
 * Display products on the page
 * @param {Array} productsToDisplay
 */
const displayProductsAndCategories = (productsToDisplay) => {
  const productsDiv = document.getElementById("products");
  if (!productsDiv) return;

  let htmlData = ``;
  if (productsToDisplay.length === 0) {
    htmlData = `<p style="color: white; text-align: center; width: 100%;">No products available in this category.</p>`;
  } else {
    productsToDisplay.forEach((data, index) => {
      htmlData += `<div class="product-item" key="${`${index}-${data.title}`}">
          <img src="${data.image}" alt="${data.title}" />
          <h3>${data.title}</h3>
          <p>Price: $${data.price}</p>
          <input type="number" min="1" value="1" onchange="onProductsCountChange(${
            data.id
          }, this)" />
          <button onclick="onBuyProduct(${data.id})">Buy Now</button>
        </div>`;
    });
  }
  productsDiv.innerHTML = htmlData;
};

/**
 * Filter products based on category
 * @param {Event} event
 */
const filterCategory = (event) => {
  event.preventDefault(); // Prevent default anchor behavior

  // Remove 'active' class from all links
  const navLinks = document.querySelectorAll(".nav-items a");
  navLinks.forEach((link) => {
    link.classList.remove("active");
  });

  // Add 'active' class to the clicked link
  event.target.classList.add("active");

  // Get the category from data-category attribute
  const category = event.target.getAttribute("data-category");

  // Clear the search box
  const searchBox = document.getElementById("searchBox");
  if (searchBox) {
    searchBox.value = "";
  }

  if (category === "default") {
    displayProductsAndCategories(products);
  } else {
    const filteredProducts = products.filter(
      (pData) => pData.category.toLowerCase() === category.toLowerCase()
    );
    displayProductsAndCategories(filteredProducts);
  }
};

/**
 * Search for products by name
 */
const searchProducts = () => {
  const searchBox = document.getElementById("searchBox");
  if (!searchBox) return;

  const query = searchBox.value.trim().toLowerCase();
  if (query === "") {
    displayProductsAndCategories(products);
    return;
  }
  const searchedProducts = products.filter((pData) =>
    pData.title.toLowerCase().includes(query)
  );
  displayProductsAndCategories(searchedProducts);
};

/**
 * Handle buying a product
 * @param {Number} id
 */
const onBuyProduct = (id) => {
  const product = products.find((pData) => pData.id === id);
  if (!product) {
    alert("Product not found!");
    return;
  }
  const count = Number(productsCount[id] || 1);
  if (count < 1) {
    alert("Please enter a valid quantity.");
    return;
  }
  localStorage.setItem(
    "buy_product",
    JSON.stringify({
      ...product,
      count: count,
    })
  );
  window.location.href = "payment.html";
};

/**
 * Update product count based on user input
 * @param {Number} id
 * @param {HTMLElement} elem
 */
const onProductsCountChange = (id, elem) => {
  const value = parseInt(elem.value, 10);
  if (isNaN(value) || value < 1) {
    elem.value = 1;
    productsCount[id] = 1;
  } else {
    productsCount[id] = value;
  }
};

// ============================
// Payment and Billing Functions
// ============================

/**
 * Handle payment form submission
 * @param {Event} event
 */
const onPaymentSubmit = (event) => {
  event.preventDefault(); // Prevent form from submitting

  const form = event.target;
  const formData = new FormData(form);
  const paymentDetails = {
    phone: formData.get("phone"),
    address: formData.get("address"),
    city: formData.get("city"),
    zip: formData.get("zip"),
    method: formData.get("method"),
  };
  localStorage.setItem("payment_details", JSON.stringify(paymentDetails));
  window.location.href = "bill.html";
};

/**
 * Display the billing information
 */
const displayBill = () => {
  const payment_details = JSON.parse(
    localStorage.getItem("payment_details") || "null"
  );
  const data = JSON.parse(localStorage.getItem("buy_product") || "null");
  if (!payment_details || !data) {
    window.location.href = "main.html";
  }
  const billHtml = `
    <div class="bill-item">
      <img src="${data.image}" alt="${data.title}" />
      <h3>${data.title}</h3>
      <p>Item Price: $${data.price}</p>
      <p>Item Count: ${data.count}</p>
      <p>Total Price: $${(data.price * data.count).toFixed(2)}</p>
      <p>Address: ${payment_details.address}, ${payment_details.city}, ${
    payment_details.zip
  }</p>
      <p>Phone No: ${payment_details.phone}</p>
      <p>Payment Method: ${payment_details.method}</p>
      <button onclick="onBillDone()">Done</button>
    </div>
  `;
  const billForm = document.getElementById("billform");
  if (billForm) {
    billForm.innerHTML = billHtml;
  }
};

/**
 * Handle bill completion
 */
const onBillDone = () => {
  localStorage.removeItem("buy_product");
  localStorage.removeItem("payment_details");
  window.location.href = "main.html";
};

// ============================
// Initialization
// ============================

document.addEventListener("DOMContentLoaded", async () => {
  // Check login status on all pages except login and signup
  const currentPage = window.location.pathname.split("/").pop();
  if (!["index.html", "signup.html"].includes(currentPage)) {
    checkLogin();
  }

  // Attach login handler if on login page
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Attach sign-up handler if on sign-up page
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", handleSignUp);
  }

  // Fetch and display products if on index.html
  if (
    currentPage === "main.html" ||
    currentPage === "" ||
    currentPage === "/"
  ) {
    await fetchProducts();
  }

  // Display bill if on bill.html
  if (currentPage === "bill.html") {
    displayBill();
  }
});
