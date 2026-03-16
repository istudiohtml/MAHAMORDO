-- Add unique constraint on stripeCustomerId
CREATE UNIQUE INDEX "users_stripeCustomerId_key" ON "users"("stripeCustomerId");
