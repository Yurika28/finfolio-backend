
import Navbar from "@/components/features/navigation-bar";
import Footer from "@/components/features/footer";

export default function AboutPage() {
  return (
    <>
        <header>
         <Navbar/>
        </header>
        

        <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
            <h1 className="text-4xl font-bold text-accent">About FinPulse</h1>

            <section className="space-y-4">
                <p className="text-lg text-muted-foreground">
                <strong>FinPulse</strong> delivers real-time market data and sentiment-driven news to help investors, analysts, and businesses stay ahead of the curve.
                </p>
                <p className="text-lg text-muted-foreground">
                Our platform is powered by the <strong>Finance API</strong>, providing fast, reliable, and scalable access to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground">
                <li>Live stock, crypto, and index data</li>
                <li>Curated financial news with sentiment scoring</li>
                <li>Detailed company profiles and market insights</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-accent">Our Mission</h2>
                <p className="text-muted-foreground">
                We believe financial data should be:
                </p>
                <ul className="list-disc list-inside text-muted-foreground">
                <li><strong>Fast</strong> — because timing is everything</li>
                <li><strong>Transparent</strong> — because clarity builds trust</li>
                <li><strong>Insightful</strong> — because data should tell a story</li>
                </ul>
            </section>

            <section className="space-y-4">
                <h2 className="text-2xl font-semibold text-accent">Join the Pulse</h2>
                <p className="text-muted-foreground">
                Whether you&apos;re tracking tickers, exploring trends, or researching companies, FinPulse is your companion for smarter market decisions.
                </p>
            </section>
        </main>

        <footer>
            <Footer></Footer>
        </footer>
    </>
    
  );
}