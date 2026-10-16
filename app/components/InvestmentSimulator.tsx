"use client";

import React, { useState, useMemo, useId, useSyncExternalStore } from "react";
import {
  TrendingUp,
  Coins,
  Calculator,
  Calendar,
  Percent,
  Sparkles,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// ─── Hook pour éviter tout décalage d'hydratation avec Recharts ──────────────
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface InvestmentSimulatorProps {
  /** Montant initial placé au départ (en FCFA) */
  initialMontant?: number;
  /** Épargne additionnelle versée chaque mois (en FCFA) */
  initialContribution?: number;
  /** Taux de rendement annuel estimé (en %) */
  initialTaux?: number;
  /** Horizon de placement (en années) */
  initialDuree?: number;
  /** Devise monétaire (par défaut "FCFA") */
  currency?: string;
  /** Classe CSS additionnelle */
  className?: string;
}

interface YearDataPoint {
  year: number;
  yearLabel: string;
  capital: number;
  totalInvesti: number;
  interets: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
    payload: YearDataPoint;
  }>;
  label?: string;
  currency?: string;
}

// ─── Tooltip Custom Dark Mode Strict ─────────────────────────────────────────
function CustomTooltip({ active, payload, currency = "FCFA" }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-3.5 shadow-2xl min-w-[210px] text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
          <span className="font-bold text-[#FAFAFA]">Année {data.year}</span>
          <span className="text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
            Projection
          </span>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              Capital total :
            </span>
            <span className="font-extrabold text-[#FAFAFA]">
              {data.capital.toLocaleString("fr-FR")} {currency}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A1A1AA] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#71717A]" />
              Total investi :
            </span>
            <span className="font-semibold text-[#FAFAFA]">
              {data.totalInvesti.toLocaleString("fr-FR")} {currency}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#27272A]/70">
            <span className="text-[#EF4444] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#EF4444]" />
              Gains cumulés :
            </span>
            <span className="font-extrabold text-[#EF4444]">
              +{data.interets.toLocaleString("fr-FR")} {currency}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Composant Principal InvestmentSimulator ─────────────────────────────────
export default function InvestmentSimulator({
  initialMontant = 100000,
  initialContribution = 25000,
  initialTaux = 5,
  initialDuree = 10,
  currency = "FCFA",
  className = "",
}: InvestmentSimulatorProps) {
  const isMounted = useIsMounted();

  // États locaux des 4 paramètres du simulateur
  const [montantInitial, setMontantInitial] = useState<number>(initialMontant);
  const [contributionMensuelle, setContributionMensuelle] = useState<number>(initialContribution);
  const [tauxAnnuel, setTauxAnnuel] = useState<number>(initialTaux);
  const [dureeAnnees, setDureeAnnees] = useState<number>(initialDuree);

  // Identifiants uniques accessibles
  const initialInputId = useId();
  const contributionInputId = useId();
  const tauxInputId = useId();
  const dureeInputId = useId();

  // ── Logique mathématique des intérêts composés (mémorisée) ────────────────
  const { chartData, capitalFinal, totalInvesti, interetsGeneres, plusValuePourcent } =
    useMemo(() => {
      const P = Math.max(0, Number(montantInitial) || 0);
      const PMT = Math.max(0, Number(contributionMensuelle) || 0);
      const r = Math.max(0, Number(tauxAnnuel) || 0) / 100;
      const years = Math.max(1, Math.min(40, Math.round(Number(dureeAnnees) || 1)));

      const i = r / 12; // taux mensuel
      const points: YearDataPoint[] = [];

      // Année 0 (Point de départ)
      points.push({
        year: 0,
        yearLabel: "Départ",
        capital: Math.round(P),
        totalInvesti: Math.round(P),
        interets: 0,
      });

      // Simulation année par année
      for (let t = 1; t <= years; t++) {
        const n = t * 12; // Nombre total de mois écoulés
        let capitalT = 0;

        if (i > 0) {
          // Formule de la rente avec intérêts composés :
          // Capital = P * (1 + i)^n + PMT * [((1 + i)^n - 1) / i]
          const growthFactor = Math.pow(1 + i, n);
          const capitalPrincipal = P * growthFactor;
          const capitalContributions = PMT * ((growthFactor - 1) / i);
          capitalT = capitalPrincipal + capitalContributions;
        } else {
          capitalT = P + PMT * n;
        }

        const totalInvestiT = P + PMT * n;
        const interetsT = Math.max(0, capitalT - totalInvestiT);

        points.push({
          year: t,
          yearLabel: `An ${t}`,
          capital: Math.round(capitalT),
          totalInvesti: Math.round(totalInvestiT),
          interets: Math.round(interetsT),
        });
      }

      const finalPoint = points[points.length - 1];
      const capFinal = finalPoint ? finalPoint.capital : P;
      const totInvest = finalPoint ? finalPoint.totalInvesti : P;
      const gains = Math.max(0, capFinal - totInvest);
      const gainPercent = totInvest > 0 ? (gains / totInvest) * 100 : 0;

      return {
        chartData: points,
        capitalFinal: capFinal,
        totalInvesti: totInvest,
        interetsGeneres: gains,
        plusValuePourcent: gainPercent,
      };
    }, [montantInitial, contributionMensuelle, tauxAnnuel, dureeAnnees]);

  // Formatage des grands nombres pour les axes
  const formatYAxis = (val: number) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${Math.round(val / 1_000)}k`;
    return `${val}`;
  };

  return (
    <Card
      className={`relative overflow-hidden bg-[#18181B] border-[#27272A] text-[#FAFAFA] shadow-2xl rounded-2xl ${className}`}
    >
      {/* Halo de lueur ambiante Dark Mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-[#EF4444]/10 blur-3xl"
      />

      {/* ── En-tête de la carte ── */}
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-[#27272A]/70">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/25 text-[#EF4444] shadow-inner shadow-[#EF4444]/20">
              <TrendingUp className="h-6 w-6 stroke-[2]" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                <span>Simulateur d&apos;investissement</span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/20 px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
                  <Sparkles className="w-2.5 h-2.5" />
                  Intérêts composés
                </span>
              </CardTitle>
              <CardDescription className="text-xs text-[#A1A1AA] mt-0.5">
                Projetez la croissance exponentielle de votre épargne au fil du temps
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#09090B] border border-[#27272A] text-xs font-semibold text-[#A1A1AA]">
              <Coins className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Devise : {currency}</span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 pt-6">
        {/* Grille 2 colonnes : Formulaire (gauche) & Résultats/Graphique (droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ═════════════════════════════════════════════════════════════════
              COLONNE DE GAUCHE : FORMULAIRE PARAMÉTRABLE (5 cols)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-4 rounded-xl bg-[#09090B] border border-[#27272A] space-y-4">
              
              {/* 1. Montant initial */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={initialInputId}
                    className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5"
                  >
                    <Calculator className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Montant initial</span>
                  </Label>
                  <span className="text-[11px] font-bold text-[#FAFAFA]">
                    {montantInitial.toLocaleString("fr-FR")} {currency}
                  </span>
                </div>
                <Input
                  id={initialInputId}
                  type="number"
                  min={0}
                  step={10000}
                  value={montantInitial || ""}
                  onChange={(e) => setMontantInitial(Number(e.target.value) || 0)}
                  placeholder="ex: 100 000"
                  className="bg-[#18181B] border-[#27272A] text-[#FAFAFA] text-sm h-10 focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]"
                />
                {/* Raccourcis rapides */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[50000, 100000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMontantInitial(preset)}
                      className="px-2 py-0.5 rounded-md bg-[#27272A]/50 hover:bg-[#27272A] text-[10px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Contribution mensuelle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={contributionInputId}
                    className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5"
                  >
                    <Coins className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Contribution mensuelle</span>
                  </Label>
                  <span className="text-[11px] font-bold text-[#FAFAFA]">
                    {contributionMensuelle.toLocaleString("fr-FR")} {currency}/mois
                  </span>
                </div>
                <Input
                  id={contributionInputId}
                  type="number"
                  min={0}
                  step={5000}
                  value={contributionMensuelle || ""}
                  onChange={(e) => setContributionMensuelle(Number(e.target.value) || 0)}
                  placeholder="ex: 25 000"
                  className="bg-[#18181B] border-[#27272A] text-[#FAFAFA] text-sm h-10 focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]"
                />
                <div className="flex items-center gap-1.5 pt-0.5">
                  {[10000, 25000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setContributionMensuelle(preset)}
                      className="px-2 py-0.5 rounded-md bg-[#27272A]/50 hover:bg-[#27272A] text-[10px] font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                    >
                      {preset >= 1000 ? `${preset / 1000}k` : preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Taux d'intérêt annuel (%) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={tauxInputId}
                    className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5"
                  >
                    <Percent className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Taux d&apos;intérêt annuel</span>
                  </Label>
                  <span className="text-xs font-extrabold text-[#EF4444]">
                    {tauxAnnuel}% / an
                  </span>
                </div>
                <div className="space-y-2">
                  <Input
                    id={tauxInputId}
                    type="number"
                    min={0.5}
                    max={30}
                    step={0.5}
                    value={tauxAnnuel || ""}
                    onChange={(e) => setTauxAnnuel(Number(e.target.value) || 0)}
                    className="bg-[#18181B] border-[#27272A] text-[#FAFAFA] text-sm h-10 focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]"
                  />
                  {/* Slider pour réglage tactile fluide */}
                  <input
                    type="range"
                    min={1}
                    max={20}
                    step={0.5}
                    value={tauxAnnuel}
                    onChange={(e) => setTauxAnnuel(Number(e.target.value))}
                    className="w-full accent-[#EF4444] cursor-pointer h-1.5 bg-[#27272A] rounded-lg"
                  />
                </div>
              </div>

              {/* 4. Durée de l'investissement */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={dureeInputId}
                    className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span>Durée de placement</span>
                  </Label>
                  <span className="text-xs font-extrabold text-[#FAFAFA]">
                    {dureeAnnees} ans ({dureeAnnees * 12} mois)
                  </span>
                </div>
                <div className="space-y-2">
                  <Input
                    id={dureeInputId}
                    type="number"
                    min={1}
                    max={40}
                    step={1}
                    value={dureeAnnees || ""}
                    onChange={(e) => setDureeAnnees(Number(e.target.value) || 1)}
                    className="bg-[#18181B] border-[#27272A] text-[#FAFAFA] text-sm h-10 focus-visible:border-[#EF4444] focus-visible:ring-[#EF4444]"
                  />
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={dureeAnnees}
                    onChange={(e) => setDureeAnnees(Number(e.target.value))}
                    className="w-full accent-[#EF4444] cursor-pointer h-1.5 bg-[#27272A] rounded-lg"
                  />
                </div>
              </div>

            </div>

            {/* Note explicative pédagogique */}
            <div className="p-3 rounded-xl bg-[#27272A]/30 border border-[#27272A]/60 flex items-start gap-2.5 text-[11px] text-[#A1A1AA]">
              <Info className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
              <span>
                Les intérêts sont réinvestis mensuellement. Cet effet boule de neige
                multiplie votre capital sans effort additionnel.
              </span>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              COLONNE DE DROITE : RÉSULTATS CLÉS & GRAPHIQUE RECHARTS (7 cols)
          ══════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* 1. Bloc de synthèse du Capital final estimé */}
            <div className="p-5 rounded-2xl bg-[#09090B] border border-[#27272A] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
                    Capital final estimé à terme
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#FAFAFA]">
                      {capitalFinal.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-lg font-bold text-[#EF4444]">
                      {currency}
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>+{plusValuePourcent.toFixed(1)}% de gains</span>
                </div>
              </div>

              {/* Comparatif : Total investi vs Intérêts générés */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[#27272A]">
                <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                  <p className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider">
                    Total investi (votre épargne)
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-[#FAFAFA] mt-0.5">
                    {totalInvesti.toLocaleString("fr-FR")} {currency}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
                  <p className="text-[10px] font-medium text-[#71717A] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#EF4444]" />
                    <span>Intérêts générés</span>
                  </p>
                  <p className="text-sm sm:text-base font-extrabold text-[#EF4444] mt-0.5">
                    +{interetsGeneres.toLocaleString("fr-FR")} {currency}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Graphique d'évolution Recharts */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#09090B] border border-[#27272A] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#FAFAFA]">
                    Courbe de progression du capital
                  </h4>
                  <p className="text-[10px] text-[#A1A1AA]">
                    Évolution annuelle cumulée (Capital vs Effort d&apos;épargne)
                  </p>
                </div>

                {/* Légende du graphique */}
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#EF4444]" />
                    <span className="text-[#A1A1AA]">Capital Total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-[#71717A]" />
                    <span className="text-[#A1A1AA]">Investi</span>
                  </div>
                </div>
              </div>

              {/* Conteneur Recharts avec sécurité d'hydratation */}
              <div className="h-[240px] sm:h-[260px] w-full pt-2">
                {isMounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <defs>
                        {/* Dégradé Accent #EF4444 pour le capital final */}
                        <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                        </linearGradient>
                        {/* Dégradé discret pour le total investi */}
                        <linearGradient id="investiGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#71717A" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#71717A" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#27272A"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="yearLabel"
                        stroke="#71717A"
                        tick={{ fill: "#A1A1AA", fontSize: 10 }}
                        tickLine={{ stroke: "#27272A" }}
                        axisLine={{ stroke: "#27272A" }}
                      />

                      <YAxis
                        stroke="#71717A"
                        tickFormatter={formatYAxis}
                        tick={{ fill: "#A1A1AA", fontSize: 10 }}
                        tickLine={{ stroke: "#27272A" }}
                        axisLine={{ stroke: "#27272A" }}
                      />

                      <Tooltip
                        content={<CustomTooltip currency={currency} />}
                        cursor={{ stroke: "#EF4444", strokeWidth: 1, strokeDasharray: "3 3" }}
                      />

                      {/* Aire : Total investi */}
                      <Area
                        type="monotone"
                        dataKey="totalInvesti"
                        stroke="#71717A"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#investiGradient)"
                        name="Investi"
                      />

                      {/* Aire principale : Capital Total avec intérêts composés */}
                      <Area
                        type="monotone"
                        dataKey="capital"
                        stroke="#EF4444"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#capitalGradient)"
                        name="Capital"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#09090B] rounded-xl text-xs text-[#71717A] animate-pulse">
                    Chargement de la projection...
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </CardContent>
    </Card>
  );
}
