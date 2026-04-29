import { Link } from "react-router-dom";
import { Search, Package, CheckCircle2 } from "lucide-react";
import { StiLogo } from "@/components/app/StiLogo";

const FeatureCard = ({
  icon: Icon,
  title,
  desc,
  delay,
}: {
  icon: typeof Search;
  title: string;
  desc: string;
  delay: string;
}) => (
  <Link
    to="/login"
    className="group bg-card text-card-foreground p-6 rounded-2xl w-64 text-center shadow-elevated transition-all duration-300 hover:-translate-y-3 hover:shadow-blue border-2 border-transparent hover:border-sti-yellow-bright animate-fade-slide-up"
    style={{ animationDelay: delay, opacity: 0, animationFillMode: "forwards" }}
  >
    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 transition-all group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-primary/20">
      <Icon className="w-6 h-6 text-primary" />
    </div>
    <h4 className="text-sti-blue font-bold mb-2">{title}</h4>
    <p className="text-sm text-muted-foreground">{desc}</p>
    <span className="inline-block mt-3 text-xs font-semibold text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
      Go →
    </span>
  </Link>
);

export default function Welcome() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <nav className="flex items-center justify-between px-[5%] py-4 bg-[hsl(50_100%_95%)] shadow-md animate-fade-down">
        <div className="flex items-center gap-2">
          <div className="bg-sti-yellow-bright text-sti-blue font-black px-2.5 py-1 rounded text-lg tracking-tighter hover:scale-105 transition-transform">
            STI
          </div>
          <span className="font-bold text-base sm:text-lg text-foreground/90 text-black">
            Education Services Group
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-8">
          <a href="#" className="hidden sm:block text-sm font-medium text-foreground/80 text-black hover:text-sti-blue transition-colors">
            Campus Helpdesk
          </a>
          <a href="#" className="hidden sm:block text-sm font-medium text-foreground/80 text-black hover:text-sti-blue transition-colors">
            FAQ
          </a>
          <Link
            to="/login"
            className="bg-[hsl(199_100%_36%)] text-white px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[hsl(199_100%_30%)] hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative gradient-sti-yellow flex-1 flex items-center px-[5%] py-16 overflow-hidden min-h-[70vh]">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(white 20%, transparent 20%)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center md:text-left">
            <span
              className="block text-white text-2xl md:text-3xl font-extrabold mb-2 animate-slide-right"
              style={{ animationDelay: "0.2s", textShadow: "2px 2px 0 hsl(0 0% 0% / 0.1)" }}
            >
              BE SECURE. BE STI.
            </span>
            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-black text-white uppercase leading-none mb-5 text-stroke-sti animate-slide-right"
              style={{ animationDelay: "0.35s" }}
            >
              STIerFinds<br />MANAGER
            </h1>
            <div
              className="inline-block bg-white/85 text-sti-blue font-semibold px-5 py-2.5 rounded-lg text-base md:text-lg mb-8 animate-fade-in"
              style={{ animationDelay: "0.5s" }}
            >
              The official Lost &amp; Found portal for STI Students.
              <br />
              Report lost items or check for found belongings.
            </div>
            <div>
              <Link
                to="/login"
                className="inline-block bg-sti-blue text-white text-lg font-bold px-10 py-4 rounded-full animate-pulse-glow hover:scale-105 hover:bg-[hsl(207_100%_25%)] transition-all"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
          <div className="hidden md:flex flex-1 justify-end animate-pop-in" style={{ animationDelay: "0.5s" }}>
            <div className="w-72 h-72 bg-white/20 backdrop-blur-sm rounded-3xl border-4 border-white shadow-elevated flex items-center justify-center animate-float">
              <Search className="w-32 h-32 text-sti-blue" strokeWidth={2} />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-5 px-4 -mt-12 pb-16 z-10 relative">
        <FeatureCard icon={Search} title="Report Lost" desc="Lost something on campus? File a report instantly." delay="0.1s" />
        <FeatureCard icon={Package} title="Check Found" desc="Browse the database of items found by security." delay="0.25s" />
        <FeatureCard icon={CheckCircle2} title="Claim Items" desc="Verification process to safely claim your belongings." delay="0.4s" />
      </section>

      <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border">
        © {new Date().getFullYear()} STIerFinds Manager · STI Education Services Group
      </footer>
    </div>
  );
}
