import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <article class="post-article">
        <!-- Header: Sans-Serif (Global h1) -->
        <header class="post-header-section">
          <h1>01 Blog Privacy Policy</h1>
          <div class="meta-info">
            <span class="date">Last updated: December 7, 2025</span>
          </div>
        </header>

        <!-- Body: Serif (Global .article-content) -->
        <section class="article-content">
          <p class="intro">
            At <strong>01 Blog</strong>, we take your privacy seriously. This Privacy Policy
            describes how your personal information is collected, used, and shared when you visit or
            make a purchase from our platform.
          </p>

          <h2>01. Information We Collect</h2>
          <p>
            When you visit the Site, we automatically collect certain information about your device,
            including information about your web browser, IP address, time zone, and some of the
            cookies that are installed on your device.
          </p>
          <ul>
            <li>
              <strong>Device Information:</strong> We collect information about the individual web
              pages or products that you view, what websites or search terms referred you to the
              Site.
            </li>
            <li>
              <strong>User Account Data:</strong> When you register, we collect your username, email
              address, and biographical information you choose to provide.
            </li>
          </ul>

          <h2>02. How We Use Your Information</h2>
          <p>
            We use the personal information that we collect generally to fulfill any orders placed
            through the Site (including processing your payment information, arranging for shipping,
            and providing you with invoices and/or order confirmations). Additionally, we use this
            information to:
          </p>
          <ul>
            <li>Communicate with you;</li>
            <li>Screen our orders for potential risk or fraud; and</li>
            <li>
              Provide you with information or advertising relating to our products or services.
            </li>
          </ul>

          <h2>03. Sharing Your Personal Information</h2>
          <p>
            We share your Personal Information with third parties to help us use your Personal
            Information, as described above. We also use Google Analytics to help us understand how
            our customers use the Site.
          </p>

          <h2>04. Your Rights</h2>
          <p>
            If you are a European resident, you have the right to access personal information we
            hold about you and to ask that your personal information be corrected, updated, or
            deleted. If you would like to exercise this right, please contact us through the contact
            information below.
          </p>

          <h2>05. Contact Us</h2>
          <p>
            For more information about our privacy practices, if you have questions, or if you would
            like to make a complaint, please contact us by e-mail at
            <strong>support&#64;01blog.com</strong>.
          </p>
        </section>

        <!-- Footer / Back Link -->
        <div class="post-footer-actions">
          <a routerLink="/" class="back-link">← Back to Home</a>
        </div>
      </article>
    </div>
  `,
  styles: [
    `
      /* Container to center the "Story" */
      .page-container {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 100px 24px 60px 24px; /* Matches Global Feed Padding */
        background-color: var(--background);
      }

      .post-article {
        width: 100%;
        max-width: 680px; /* Standard Medium Width */
      }

      /* --- Header Styles --- */
      .post-header-section {
        margin-bottom: 48px;
      }

      /* H1 is handled by Global CSS (Sans-Serif, 42px), 
       but we ensure margin aligns with Medium style */
      h1 {
        margin-bottom: 16px;
        color: var(--text-primary);
      }

      .meta-info {
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        color: var(--text-secondary);
      }

      /* --- Body Styles (Mapping to Global .article-content) --- */
      /* 
       Note: The global CSS class .article-content handles:
       - Font: Charter / Georgia (Serif)
       - Size: 20px
       - Line-height: 1.58
    */
      .article-content h2 {
        /* Global H2 is Sans-Serif */
        margin-top: 48px;
        margin-bottom: 16px;
        font-size: 24px;
      }

      .article-content p {
        margin-bottom: 24px;
        color: var(--text-primary); /* #242424 or Oklch equiv */
      }

      .article-content ul {
        margin-bottom: 24px;
        padding-left: 20px;
        list-style-type: disc;
      }

      .article-content li {
        margin-bottom: 12px;
        color: var(--text-primary);
      }

      .intro {
        font-style: italic;
        color: var(--text-secondary); /* Slightly lighter for intro */
        font-size: 22px;
      }

      /* --- Footer Styles --- */
      .post-footer-actions {
        margin-top: 64px;
        padding-top: 32px;
        border-top: 1px solid var(--border);
      }

      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        transition: color 0.2s;
      }

      .back-link:hover {
        color: var(--text-primary);
        text-decoration: underline;
      }
    `,
  ],
})
export class PrivacyPage {}
