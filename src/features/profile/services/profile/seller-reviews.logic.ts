export function validateSellerReviewRating(rating: number) {
  if (rating < 1 || rating > 5) {
    throw new Error("Geçerli bir puan seçiniz (1-5).");
  }
}

export function validateNotSelfReview(reviewerId: string, sellerId: string) {
  if (reviewerId === sellerId) {
    throw new Error("Kendi profilinize yorum yapamazsınız.");
  }
}
