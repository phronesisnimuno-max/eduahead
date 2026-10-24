
const flightForm = document.getElementById("flightForm");
const origin = document.getElementById("origin");
const destination = document.getElementById("destination");
const departureDate = document.getElementById("departureDate");
const returnDate = document.getElementById("returnDate");
const returnDateField = document.getElementById("returnDateField");
const flightList = document.getElementById("flightList");
const results = document.getElementById("results");
const searchSummary = document.getElementById("searchSummary");
const bookingDialog = document.getElementById("bookingDialog");
const bookingDetails = document.getElementById("bookingDetails");
const message = document.getElementById("message");

document.getElementById("year").textContent =
  new Date().getFullYear();

// Set default travel dates using local time.
function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = new Date();
const todayString = formatInputDate(today);

departureDate.min = todayString;
returnDate.min = todayString;
departureDate.value = todayString;

const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);
returnDate.value = formatInputDate(nextWeek);

// Display a temporary notification.
function showMessage(text) {
  message.textContent = text;
  message.classList.add("show");

  clearTimeout(showMessage.timer);

  showMessage.timer = setTimeout(() => {
    message.classList.remove("show");
  }, 3500);
}

// Get the selected trip type.
function getTripType() {
  return document.querySelector(
    'input[name="tripType"]:checked'
  ).value;
}

// Show or hide the return-date field.
function updateTripType() {
  const isReturn = getTripType() === "return";

  returnDateField.classList.toggle("hidden", !isReturn);
  returnDate.required = isReturn;
}

document.querySelectorAll('input[name="tripType"]')
  .forEach((radio) => {
    radio.addEventListener("change", updateTripType);
  });

updateTripType();

// Keep the return date valid.
departureDate.addEventListener("change", () => {
  returnDate.min = departureDate.value;

  if (
    returnDate.value &&
    returnDate.value < departureDate.value
  ) {
    returnDate.value = departureDate.value;
  }
});

// Swap departure and destination.
document.getElementById("swapButton")
  .addEventListener("click", () => {
    const previousOrigin = origin.value;

    origin.value = destination.value;
    destination.value = previousOrigin;
  });

// Format dates for display.
function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

// Format Nigerian naira.
function formatNaira(amount) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(amount);
}

// Get the airport code from a label.
function getAirportCode(airport) {
  const match = airport.match(/\((.*?)\)/);
  return match ? match[1] : airport;
}

// Create one flight-result card safely.
function createFlightCard(flight, index, total, cabin, passengers) {
  const card = document.createElement("article");
  card.className = "flight-card";

  const details = document.createElement("div");

  const airline = document.createElement("p");
  airline.className = "flight-label";
  airline.textContent = `Ibom Air · Demo flight ${index + 1}`;

  const departureTime = document.createElement("p");
  departureTime.className = "flight-time";
  departureTime.textContent = flight.departure;

  const departureAirport = document.createElement("p");
  departureAirport.className = "airport";
  departureAirport.textContent = flight.from;

  details.append(airline, departureTime, departureAirport);

  const route = document.createElement("div");
  route.className = "route";

  const duration = document.createElement("div");
  const durationText = document.createElement("p");
  durationText.className = "airport";
  durationText.textContent = flight.duration;
  duration.appendChild(durationText);

  const line = document.createElement("div");
  line.className = "route-line";

  const arrival = document.createElement("div");

  const arrivalTime = document.createElement("p");
  arrivalTime.className = "flight-time";
  arrivalTime.textContent = flight.arrival;

  const arrivalAirport = document.createElement("p");
  arrivalAirport.className = "airport";
  arrivalAirport.textContent = flight.to;

  arrival.append(arrivalTime, arrivalAirport);
  route.append(duration, line, arrival);

  const priceArea = document.createElement("div");
  priceArea.className = "price-area";

  const price = document.createElement("p");
  price.className = "price";
  price.textContent = formatNaira(total);

  const caption = document.createElement("small");
  caption.textContent =
    `${passengers} passenger(s) · ${cabin}`;

  const selectButton = document.createElement("button");
  selectButton.type = "button";
  selectButton.className = "choose-button";
  selectButton.textContent = "Select flight →";

  selectButton.addEventListener("click", () => {
    bookingDetails.textContent =
      `${origin.value} to ${destination.value}. ` +
      `Departure: ${formatDate(departureDate.value)}. ` +
      `${getTripType() === "return"
        ? "Return: " + formatDate(returnDate.value) + ". "
        : "One-way journey. "}` +
      `Passengers: ${passengers}. Cabin: ${cabin}. ` +
      `Illustrative total: ${formatNaira(total)}.`;

    if (typeof bookingDialog.showModal === "function") {
      bookingDialog.showModal();
    } else {
      showMessage(
        "Demo only. Visit the official Ibom Air website to book."
      );
    }
  });

  priceArea.append(price, caption, selectButton);
  card.append(details, route, priceArea);

  return card;
}

// Search for sample flights.
flightForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (origin.value === destination.value) {
    showMessage(
      "Please select different departure and destination airports."
    );
    return;
  }

  if (
    getTripType() === "return" &&
    returnDate.value < departureDate.value
  ) {
    showMessage(
      "The return date cannot be before the departure date."
    );
    return;
  }

  const passengers = Number(
    document.getElementById("passengers").value
  );

  const cabin = document.getElementById("cabin").value;
  const from = getAirportCode(origin.value);
  const to = getAirportCode(destination.value);

  // Illustrative fares only; these are NOT live airline prices.
  const routeNumber =
    [...origin.value + destination.value]
      .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  const baseFare = 55000 + (routeNumber % 40000);
  const cabinMultiplier = cabin === "Business" ? 2.1 : 1;

  const sampleFlights = [
    {
      departure: "08:15",
      arrival: "09:20",
      duration: "1h 05m",
      fare: baseFare
    },
    {
      departure: "13:40",
      arrival: "14:45",
      duration: "1h 05m",
      fare: baseFare + 8500
    },
    {
      departure: "17:25",
      arrival: "18:30",
      duration: "1h 05m",
      fare: baseFare + 12500
    }
  ];

  // Build the results without inserting user input as HTML.
  flightList.replaceChildren();

  sampleFlights.forEach((flight, index) => {
    const total = Math.round(
      flight.fare * cabinMultiplier * passengers
    );

    const card = createFlightCard(
      {
        ...flight,
        from,
        to
      },
      index,
      total,
      cabin,
      passengers
    );

    flightList.appendChild(card);
  });

  searchSummary.textContent =
    `${origin.value} → ${destination.value} · ` +
    `Departure: ${formatDate(departureDate.value)} · ` +
    (getTripType() === "return"
      ? `Return: ${formatDate(returnDate.value)} · `
      : "One way · ") +
    `${passengers} passenger(s)`;

  results.classList.remove("hidden");

  results.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

// Close the booking dialog.
document.getElementById("closeDialog")
  .addEventListener("click", () => {
    bookingDialog.close();
  });

// Close the dialog when the backdrop is clicked.
bookingDialog.addEventListener("click", (event) => {
  if (event.target === bookingDialog) {
    bookingDialog.close();
  }
});

// Manage-booking demonstration.
document.getElementById("manageForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();

    showMessage(
      "This demo cannot retrieve real bookings. " +
      "Please use the official Ibom Air website."
    );
  });

// Mobile navigation.
const menuToggle = document.getElementById("menuToggle");
const navigation = document.getElementById("navigation");

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Toggle navigation"
  );
});

navigation.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navigation.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});
