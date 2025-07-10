import Link from "next/link";
import { Button } from "./ui/button";

export function Hero() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <h3 className="text-3xl lg:text-4xl !leading-tight mx-auto max-w-xl text-center">
        AI Chat That Understands, Learns, and Delivers
      </h3>
      <p className="text-muted-foreground text-center">
        Experience next-gen customer interactions—intelligent, personalized, and
        lightning-fast.
      </p>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />

      <Link
        href="/auth/sign-up"
        className="w-full flex justify-center"
        passHref
      >
        <Button size="lg">Get Started</Button>
      </Link>
    </div>
  );
}
