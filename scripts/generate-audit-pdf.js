const fs = require("fs");
const path = require("path");
const { jsPDF } = require("jspdf");
const autoTable = require("jspdf-autotable").default || require("jspdf-autotable");

function generateAuditPdf() {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Couleurs de la charte
  const primaryRed = [239, 68, 68];       // #EF4444 (Crimson GestFiPro)
  const darkNavy = [15, 23, 42];          // #0F172A (Ardoise sombre)
  const slateDark = [30, 41, 59];         // #1E293B
  const slateMuted = [100, 116, 139];     // #64748B
  const bgLight = [248, 250, 252];        // #F8FAFC
  const borderLight = [226, 232, 240];    // #E2E8F0
  const successGreen = [16, 185, 129];    // #10B981

  let currentY = 16;

  // ── 1. EN-TÊTE DE PREMIÈRE PAGE ───────────────────────────────────────────
  // Bandeau supérieur moderne
  doc.setFillColor(...darkNavy);
  doc.roundedRect(margin, currentY, contentWidth, 28, 3, 3, "F");

  // Accent rouge crimson
  doc.setFillColor(...primaryRed);
  doc.rect(margin, currentY, 4, 28, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("GESTFIPRO · AUDIT DE SÉCURITÉ COMPLET", margin + 8, currentY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    "Rapport d'évaluation de sécurité défensive, durcissement du code et validation en production",
    margin + 8,
    currentY + 20
  );

  currentY += 34;

  // ── 2. BLOC MÉTADONNÉES & STATUT ──────────────────────────────────────────
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2.5, 2.5, "FD");

  const colW = contentWidth / 4;
  const metaFields = [
    { label: "APPLICATION", value: "GestFiPro SaaS (Next.js 16)" },
    { label: "DATE DE L'AUDIT", value: "20 Octobre 2026" },
    { label: "TYPE D'AUDIT", value: "Full-Stack & Dépendances" },
    { label: "STATUT FINAL", value: "100% CORRIGÉ & DÉPLOYÉ", isBadge: true },
  ];

  metaFields.forEach((item, idx) => {
    const x = margin + idx * colW + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text(item.label, x, currentY + 7);

    if (item.isBadge) {
      doc.setFillColor(220, 252, 231);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(x, currentY + 10, colW - 8, 8, 1.5, 1.5, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(21, 128, 61);
      doc.text(item.value, x + 2, currentY + 15.5);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...slateDark);
      doc.text(item.value, x, currentY + 15.5);
    }
  });

  currentY += 30;

  // ── 3. RÉSUMÉ EXÉCUTIF ────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...slateDark);
  doc.text("1. Résumé Exécutif", margin, currentY);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const execSummary =
    "Un audit de sécurité exhaustif et méthodique a été réalisé sur la plateforme GestFiPro, couvrant l'architecture Next.js 16 (App Router), la couche d'authentification et d'autorisation Supabase (RLS, cookies de session), la gestion des flux de redirection, les contrôles d'accès aux routes, la validation des entrées et fichiers d'export (CSV), l'intégration du modèle d'IA Gemini, ainsi que l'ensemble des dépendances NPM. Toutes les vulnérabilités identifiées ont été corrigées avec des solutions défensives aux standards OWASP, validées par 24 tests unitaires et intégrées au dépôt GitHub (commit b7de5a5).";

  const splitSummary = doc.splitTextToSize(execSummary, contentWidth);
  doc.text(splitSummary, margin, currentY);
  currentY += splitSummary.length * 4.2 + 4;

  // ── 4. MATRICE GLOBALE DES VULNÉRABILITÉS TRAITÉES ─────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...slateDark);
  doc.text("2. Matrice Globale des Risques & Correctifs Appliqués", margin, currentY);
  currentY += 3;

  const tableData = [
    [
      "SEC-01",
      "Contournement d'authentification & IDOR",
      "Critique",
      "api/parse-expense/route.ts",
      "Corrigé",
    ],
    [
      "SEC-02",
      "Fuite de clé API Gemini en URL & Injection de Prompt",
      "Élevée",
      "api/parse-expense/route.ts",
      "Corrigé",
    ],
    [
      "SEC-03",
      "Fuite d'erreurs internes SQL vers les clients",
      "Moyenne",
      "api/parse-expense/route.ts",
      "Corrigé",
    ],
    [
      "SEC-04",
      "Absence de protection de /historique & bypass test",
      "Élevée",
      "lib/supabase/middleware.ts",
      "Corrigé",
    ],
    [
      "SEC-05",
      "Redirections ouvertes (CWE-601, //evil.com)",
      "Élevée",
      "middleware.ts / login / callback",
      "Corrigé",
    ],
    [
      "SEC-06",
      "Empoisonnement d'en-tête Host (Host Header Poisoning)",
      "Moyenne",
      "app/auth/callback/route.ts",
      "Corrigé",
    ],
    [
      "SEC-07",
      "Injections de formules CSV / Excel (CWE-1236)",
      "Élevée",
      "DataExportCard, dashboard, historique",
      "Corrigé",
    ],
    [
      "SEC-08",
      "Absence d'en-têtes HTTP de sécurité (CSP, HSTS, Iframe)",
      "Moyenne",
      "next.config.ts",
      "Corrigé",
    ],
    [
      "SEC-09",
      "Session client non vérifiée avec getSession()",
      "Moyenne",
      "settings/page.tsx, login/page.tsx",
      "Corrigé",
    ],
    [
      "SEC-10",
      "Vulnérabilités de dépendances (sharp, source-map, brace)",
      "Élevée",
      "package-lock.json (npm audit)",
      "Corrigé",
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["ID", "Vulnérabilité / Vecteur d'attaque", "Sévérité", "Composant impacté", "Statut"]],
    body: tableData,
    margin: { left: margin, right: margin },
    theme: "striped",
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: slateDark,
      cellPadding: 2.2,
      font: "helvetica",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 15, fontStyle: "bold" },
      1: { cellWidth: 68 },
      2: { cellWidth: 20, fontStyle: "bold" },
      3: { cellWidth: 55 },
      4: { cellWidth: 24, fontStyle: "bold", halign: "center" },
    },
    didParseCell: function (data) {
      if (data.section === "body") {
        if (data.column.index === 2) {
          const val = data.cell.raw;
          if (val === "Critique") data.cell.styles.textColor = [220, 38, 38];
          else if (val === "Élevée") data.cell.styles.textColor = [234, 88, 12];
          else data.cell.styles.textColor = [202, 138, 4];
        }
        if (data.column.index === 4) {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    },
  });

  currentY = doc.lastAutoTable.finalY + 8;

  // ── NOUVELLE PAGE : DÉTAIL DES ACTIONS TECHNIQUES ────────────────────────
  doc.addPage();
  currentY = 16;

  // Titre Page 2
  doc.setFillColor(...darkNavy);
  doc.rect(margin, currentY, 3, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text("3. Détail des Correctifs Techniques Appliqués", margin + 6, currentY + 5.5);

  currentY += 12;

  const sections = [
    {
      title: "A. Création du Module de Sécurité Centralisé (lib/security.ts)",
      content:
        "• sanitizeRedirectPath : Assainit et valide rigoureusement les chemins de redirection interne. Bloque les URLs externes absolues, les URLs protocol-relative (//evil.com, /\\evil.com), les schémas javascript:/data:, ainsi que les tentatives de contournement par encodage URI masqué (%2f%2f).\n• sanitizeCsvCell : Neutralise l'exécution de formules et macros malveillantes (CWE-1236) en préfixant d'une apostrophe (') les cellules débutant par '=', '+', '-', '@', tabulations ou retours chariot, tout en préservant intacts les montants financiers signés légitimes (+350000, -2000).\n• sanitizeText : Nettoie les caractères de contrôle non imprimables et borne la taille maximale des champs.",
    },
    {
      title: "B. Sécurisation de l'API IA et Base de Données (app/api/parse-expense/route.ts)",
      content:
        "• Authentification obligatoire : Appel serveur à supabase.auth.getUser() avant tout traitement. Si la session est absente ou expirée, renvoi immédiat d'un code HTTP 401 Unauthorized.\n• Suppression du Mock User ID : Les transactions sont désormais associées au véritable identifiant cryptographique (user.id) et au compte de l'utilisateur, éliminant tout risque d'IDOR.\n• Masquage de la clé d'API Gemini : Remplacement du passage de la clé secrète en paramètre d'URL (?key=...) par l'en-tête HTTP 'x-goog-api-key', éliminant tout enregistrement dans les journaux de proxy, passerelles ou CDN.\n• Défense anti-injection de prompt : Encadrement strict des entrées dans des balises <user_input> avec instruction système formelle d'ignorer tout ordre d'écrasement ou d'exfiltration.\n• Suppression de fuite d'informations : dbError.message n'est plus renvoyé au client en cas d'erreur SQL.",
    },
    {
      title: "C. Protection des Routes & Middleware (lib/supabase/middleware.ts)",
      content:
        "• Inclusion de la route /historique dans isProtectedRoute : un utilisateur non authentifié tentant d'accéder à l'historique est immédiatement redirigé vers /login.\n• Suppression des exemptions de test : Les routes /dashboard/test-auth et /dashboard/test-db ne peuvent plus être visitées anonymement.\n• Sécurisation du paramètre redirectedFrom : Utilisation de sanitizeRedirectPath pour empêcher toute redirection hors domaine.",
    },
    {
      title: "D. Neutralisation des Redirections Ouvertes & Host Header Poisoning",
      content:
        "• Dans app/auth/callback/route.ts : L'origine est calculée de manière stricte via l'en-tête Host légitime de la requête courante au lieu de faire aveuglément confiance à x-forwarded-host arbitraire. Le paramètre 'next' est validé par sanitizeRedirectPath.\n• Dans app/login/page.tsx : Validation sécurisée des redirections après authentification par email ou Google OAuth.",
    },
    {
      title: "E. Protection Anti-Injection de Formules CSV / Excel sur Tous les Exports",
      content:
        "• Application de sanitizeCsvCell sur l'intégralité des flux d'exportation de données du SaaS :\n  - lib/activity-period.ts (buildActivitiesCsv)\n  - app/components/DataExportCard.tsx (handleExportCSV)\n  - app/dashboard/page.tsx (handleExportCSV)\n  - app/historique/page.tsx (handleExportCSV)\n• Prévention totale contre le téléchargement de fichiers CSV contenant des charges utiles DDE d'exécution de commandes.",
    },
    {
      title: "F. En-têtes HTTP de Sécurité & Confidentialité de la Stack (next.config.ts)",
      content:
        "• Content-Security-Policy (CSP) : Déclaration stricte des sources de scripts, styles, polices (Google Fonts) et connexions API Supabase/Google.\n• X-Frame-Options : DENY (Protection totale contre le Clickjacking et l'incorporation par des tiers).\n• X-Content-Type-Options : nosniff (Empêche l'interprétation de fichiers sous un type MIME erroné).\n• Strict-Transport-Security (HSTS) : max-age=31536000; includeSubDomains; preload (Forçage HTTPS).\n• Permissions-Policy : camera=(), microphone=(), geolocation=(), payment=() (Désactivation des capteurs inutilisés).\n• poweredByHeader: false : Suppression de la divulgation du serveur Next.js dans les en-têtes.",
    },
    {
      title: "G. Revalidation Cryptographique des Sessions Utilisateurs",
      content:
        "• Remplacement de supabase.auth.getSession() par supabase.auth.getUser() dans app/dashboard/settings/page.tsx et app/login/page.tsx, garantissant la revalidation du token JWT auprès du serveur d'authentification central.",
    },
  ];

  sections.forEach((sec) => {
    // Vérifier l'espace restant pour éviter de couper une section
    if (currentY > pageHeight - 38) {
      doc.addPage();
      currentY = 16;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...darkNavy);
    doc.text(sec.title, margin, currentY);
    currentY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);

    const split = doc.splitTextToSize(sec.content, contentWidth);
    doc.text(split, margin, currentY);
    currentY += split.length * 3.8 + 4;
  });

  // ── NOUVELLE PAGE : VALIDATION & RECOMMANDATIONS ─────────────────────────
  if (currentY > pageHeight - 75) {
    doc.addPage();
    currentY = 16;
  } else {
    currentY += 4;
  }

  doc.setFillColor(...darkNavy);
  doc.rect(margin, currentY, 3, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...darkNavy);
  doc.text("4. Validation, Tests & Recommandations", margin + 6, currentY + 5.5);

  currentY += 12;

  // Boîte de résultats des tests
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2.5, 2.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(22, 101, 52);
  doc.text("RÉSULTATS DES TESTS DE CONFORMITÉ & ASSURANCE QUALITÉ", margin + 5, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(21, 128, 61);
  doc.text(
    "• Suite de tests unitaires : 24 tests exécutés avec succès (node --test tests/*.test.mjs)\n• Vérification typage TypeScript : 0 erreur détectée (npx tsc --noEmit)\n• Déploiement Git : Commit b7de5a5 pushé sur la branche origin/main\n• Audit de dépendances : Vulnérabilités sharp, brace-expansion et source-map-js résolues",
    margin + 5,
    currentY + 12
  );

  currentY += 30;

  // Recommandations
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...slateDark);
  doc.text("Recommandations Opérationnelles pour le Déploiement :", margin, currentY);
  currentY += 5;

  const recs = [
    "1. Variables d'environnement : Assurez-vous que GEMINI_API_KEY et SUPABASE_SERVICE_ROLE_KEY ne sont jamais préfixées par NEXT_PUBLIC_ dans vos configurations Vercel / hébergement.",
    "2. Row Level Security (RLS) : Vérifiez que les politiques RLS restent actives (ENABLE ROW LEVEL SECURITY) sur toutes les tables de la base Supabase en production.",
    "3. Surveillance continue : Activez 'npm audit' dans vos pipelines CI/CD (GitHub Actions) pour détecter toute vulnérabilité émergente dans les dépendances tierces.",
    "4. Clés d'API tournantes : Envisagez une rotation périodique des clés d'API (Supabase Anon Key et Google Gemini API).",
  ];

  recs.forEach((rec) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const splitRec = doc.splitTextToSize(rec, contentWidth);
    doc.text(splitRec, margin, currentY);
    currentY += splitRec.length * 3.8 + 2;
  });

  // Signature / Empreinte de fin
  currentY += 6;
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text(
    "Document généré automatiquement à des fins d'assurance qualité et d'audit de sécurité logicielle. GestFiPro 2026.",
    margin,
    currentY
  );

  // ── PIED DE PAGE SUR TOUTES LES PAGES ─────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...slateMuted);
    doc.text("GestFiPro · Rapport d'Audit de Sécurité", margin, pageHeight - 7.5);
    doc.text(`Page ${i} sur ${totalPages}`, pageWidth - margin - 18, pageHeight - 7.5);
  }

  // Sauvegarde du fichier PDF
  const outputFileName = "AUDIT_SECURITE_GESTFIPRO.pdf";
  const outputPath = path.resolve(process.cwd(), outputFileName);
  const pdfBytes = doc.output("arraybuffer");
  fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

  console.log(`[SUCCESS] PDF généré avec succès : ${outputPath}`);
  console.log(`[INFO] Nombre de pages : ${totalPages}, Taille : ${pdfBytes.byteLength} octets`);
  return outputPath;
}

generateAuditPdf();
