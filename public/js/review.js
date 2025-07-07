document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".star-rating i");
  const ratingInput = document.getElementById("ratingValue");

  let currentRating = 0;

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      currentRating = index + 1;
      ratingInput.value = currentRating;
      updateStars(currentRating);
    });

    star.addEventListener("mouseover", () => {
      updateStars(index + 1);
    });

    star.addEventListener("mouseleave", () => {
      updateStars(currentRating);
    });
  });

  function updateStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add("text-warning");
      } else {
        star.classList.remove("text-warning");
      }
    });
  }

  const form = document.getElementById("reviewForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new URLSearchParams(new FormData(form));
    const listingId = window.location.pathname.split("/")[2];

    const res = await fetch(`/listings/${listingId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: data
    });

    if (res.ok) {
      location.reload();
    } else {
      alert("Failed to submit review.");
    }
  });
});
