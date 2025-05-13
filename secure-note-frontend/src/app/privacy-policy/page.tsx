'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p>
            This Privacy Policy describes how we collect, use, and handle your personal information when you use our secure notes service.
            We take your privacy seriously and are committed to protecting your personal data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>When you create an account and use our service, we collect the following information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>Account Information:</strong> Username, email address, and an encrypted password.</li>
            <li><strong>Optional Information:</strong> Full name (if provided).</li>
            <li><strong>Content Data:</strong> The notes you create, including titles and content.</li>
            <li><strong>Usage Information:</strong> How you interact with the service, IP addresses, browser type, and other technical information.</li>
            <li><strong>Security Information:</strong> Data needed to keep your account secure, such as login timestamps.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use your personal information for the following purposes:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>To provide and maintain our service</li>
            <li>To notify you about changes to our service</li>
            <li>To allow you to participate in interactive features of our service</li>
            <li>To provide customer support</li>
            <li>To gather analysis or valuable information so that we can improve our service</li>
            <li>To detect, prevent and address technical issues</li>
            <li>To protect the security and integrity of our service</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security of Your Data</h2>
          <p>
            We value your trust in providing us your personal information, so we strive to use commercially acceptable means of protecting it. 
            Your notes can be encrypted with password-based encryption, and we implement multiple layers of security to protect your data.
          </p>
          <p className="mt-2">
            However, please be aware that no method of transmission over the internet, or method of electronic storage is 100% secure. 
            While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">AI Sensitivity Analysis</h2>
          <p>
            Our service includes an AI-powered sensitivity analysis feature that evaluates the content of your notes. 
            This analysis helps identify potentially sensitive information and provides a numerical score to help you 
            decide when encryption might be appropriate.
          </p>
          <p className="mt-2">
            The AI analysis is performed securely, and we do not store the results of these analyses beyond what is 
            necessary to provide you with the sensitivity score and recommendations.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p>
            We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. 
            We will retain and use your information to the extent necessary to comply with our legal obligations, resolve disputes, 
            and enforce our policies.
          </p>
          <p className="mt-2">
            If you delete your account, all your notes and personal information will be permanently deleted from our systems, 
            except for any information we are required to retain for legal or legitimate business purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Data Protection Rights</h2>
          <p>You have the following data protection rights:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li><strong>The right to access:</strong> You have the right to request copies of your personal data.</li>
            <li><strong>The right to rectification:</strong> You have the right to request that we correct any information you believe is inaccurate or complete information you believe is incomplete.</li>
            <li><strong>The right to erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
            <li><strong>The right to restrict processing:</strong> You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
            <li><strong>The right to object to processing:</strong> You have the right to object to our processing of your personal data, under certain conditions.</li>
            <li><strong>The right to data portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you, under certain conditions.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
            and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at 
            support@securenotes.example.com.
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-border pt-6 flex justify-center">
        <Link href="/auth/register">
          <Button variant="secondary" size="lg">
            Back to Registration
          </Button>
        </Link>
      </div>
    </div>
  );
} 