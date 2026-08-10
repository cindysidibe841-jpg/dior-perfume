/* =========================================================
   NOIR & AMBRE — script.js
   1) Welcome / promo popup
   2) "New fixture" toast notification
   3) Signup form → Supabase
   ========================================================= */

/* ---------------------------------------------------------
   0. SUPABASE SETUP
   ---------------------------------------------------------
   1. Create a free project at https://supabase.com
   2. In the SQL editor, run:

      create table signups (
        id uuid primary key default gen_random_uuid(),
        full_name text not null,
        email text not null,
        phone text not null,
        gender text not null,
        created_at timestamptz default now()
      );

      create table promo_subscribers (
        id uuid primary key default gen_random_uuid(),
        email text not null,
        created_at timestamptz default now()
      );

      -- allow anonymous inserts from the public site
      alter table signups enable row level security;
      create policy "Allow public insert" on signups
        for insert to anon with check (true);

      alter table promo_subscribers enable row level security;
      create policy "Allow public insert" on promo_subscribers
        for insert to anon with check (true);

   3. Project Settings → API → copy the "Project URL" and
      the "anon public" key into the two constants below.
--------------------------------------------------------- */
const SUPABASE_URL = "https://psscidyzhxgegemgirhb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rqyVjQDLkWZu1XoHq4aIAw_Y9_RHMXz";

let supabase = null;
if (window.supabase && !SUPABASE_URL.startsWith("YOUR_")) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn("Supabase is not configured yet — add your project URL and anon key in script.js.");
}

/* ---------------------------------------------------------
   1. WELCOME / PROMO POPUP
--------------------------------------------------------- */
const welcomeModal = document.getElementById("welcomeModal");
const closeWelcome = document.getElementById("closeWelcome");
const promoForm = document.getElementById("promoForm");
const promoMsg = document.getElementById("promoMsg");

function openWelcomeModal() {
  welcomeModal.classList.remove("hidden");
}
function closeWelcomeModal() {
  welcomeModal.classList.add("hidden");
  sessionStorage.setItem("na_welcome_shown", "1");
  showFixtureToast();
}

window.addEventListener("load", () => {
  if (!sessionStorage.getItem("na_welcome_shown")) {
    setTimeout(openWelcomeModal, 900);
  }
});

closeWelcome.addEventListener("click", closeWelcomeModal);
welcomeModal.addEventListener("click", (e) => {
  if (e.target === welcomeModal) closeWelcomeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !welcomeModal.classList.contains("hidden")) closeWelcomeModal();
});

promoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("promoEmail").value.trim();
  promoMsg.textContent = "Saving...";
  promoMsg.className = "modal-fineprint";

  try {
    if (supabase) {
      const { error } = await supabase.from("promo_subscribers").insert([{ email }]);
      if (error) throw error;
    }
    promoMsg.textContent = "You're on the list — check your inbox for the 10% code.";
    promoMsg.className = "modal-fineprint ok";
    promoForm.reset();
    setTimeout(closeWelcomeModal, 1600);
  } catch (err) {
    console.error(err);
    promoMsg.textContent = "Something went wrong. Please try again.";
    promoMsg.className = "modal-fineprint err";
  }
});

/* ---------------------------------------------------------
   2. "NEW FIXTURE" TOAST (promo for a limited drop)
--------------------------------------------------------- */
function showFixtureToast() {
  if (sessionStorage.getItem("na_fixture_shown")) return;
  sessionStorage.setItem("na_fixture_shown", "1");

  const toast = document.createElement("div");
  toast.setAttribute("role", "status");
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:60;
    max-width:300px; background:#1b1717; color:#f3ead9;
    border:1px solid #c8a15b; padding:16px 18px; border-radius:2px;
    font-family:'Jost', sans-serif; font-size:0.85rem; line-height:1.5;
    box-shadow:0 10px 30px rgba(0,0,0,0.4);
    transform:translateY(20px); opacity:0; transition:all .35s ease;
  `;
  toast.innerHTML = `<strong style="color:#c8a15b; letter-spacing:.05em;">NEW FIXTURE</strong><br>
    Our limited Oud Nuit restock lands Friday — collection members get first access.`;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

/* ---------------------------------------------------------
   3. MAIN SIGNUP FORM → Supabase
--------------------------------------------------------- */
const signupForm = document.getElementById("signupForm");
const signupSubmit = document.getElementById("signupSubmit");
const signupStatus = document.getElementById("signupStatus");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    full_name: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    gender: document.getElementById("gender").value,
  };

  signupSubmit.disabled = true;
  signupSubmit.textContent = "Submitting...";
  signupStatus.textContent = "";
  signupStatus.className = "form-status";

  try {
    if (!supabase) {
      throw new Error("Supabase is not configured yet. Add your project URL and anon key in script.js.");
    }
    const { error } = await supabase.from("signups").insert([payload]);
    if (error) throw error;

    signupStatus.textContent = "Thank you — you're on the Maison list.";
    signupStatus.className = "form-status ok";
    signupForm.reset();
  } catch (err) {
    console.error(err);
    signupStatus.textContent = err.message || "Something went wrong. Please try again.";
    signupStatus.className = "form-status err";
  } finally {
    signupSubmit.disabled = false;
    signupSubmit.textContent = "Submit";
  }
});
