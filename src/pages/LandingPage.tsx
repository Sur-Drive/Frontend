import React, { useState } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { Features } from "../components/sections/Features";
import { NavigationSection } from "../components/sections/NavigationSection";
import { HowItWorks } from "../components/sections/HowItWorks";
import { HazardAlerts } from "../components/sections/HazardAlerts";
import { Community } from "../components/sections/Community";
import { FAQ } from "../components/sections/FAQ";
import { Contact } from "../components/sections/Contact";
import { FinalCTA } from "../components/sections/FinalCTA";
import { Modal } from "../components/ui/Modal";
import { ScoutMode } from "../components/sections/ScoutMode";
import { EmergencySOS } from "../components/sections/EmergencySOS";
import { Fleets } from "../components/sections/Fleets";
import { Partners } from "../components/sections/Partners";
import { ComingSoon } from "../components/sections/ComingSoon";
import { PartnersFO } from "../components/sections/PartnersFO";
import { FullWidthImage } from "../components/sections/FullWidthImage";

function LandingPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSubscribe = (email: string) => {
        console.log("Subscribed:", email);
        // Here you would typically send this to your backend
    };

    return (
        <div className="min-h-screen">
            <Header onModalOpen={() => setIsModalOpen(true)} />
            <Hero onModalOpen={() => setIsModalOpen(true)} />
            <PartnersFO />
            <Features />
            <NavigationSection />
            <HowItWorks />
            <HazardAlerts />
            <ScoutMode onModalOpen={() => setIsModalOpen(true)} />
            <EmergencySOS />
            <Community />
            <Fleets />
            <Partners />
            <ComingSoon onModalOpen={() => setIsModalOpen(true)} />
            <FAQ />
            <FinalCTA onModalOpen={() => setIsModalOpen(true)} />
            <FullWidthImage />
            <Contact />
            <Footer />
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}

export default LandingPage;