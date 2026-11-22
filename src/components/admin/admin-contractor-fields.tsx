'use client';

import { useState } from 'react';
import {
  CAPACITY_TIERS,
  CONTRACTOR_KINDS,
  PROVIDER_ROLES,
  TEAM_SIZES,
  capacityTierLabel,
  contractorKindLabel,
  providerRoleLabel,
  teamSizeLabel,
  type CapacityTier,
  type ContractorKind,
  type ProviderRole,
} from '@/lib/constants/technician-registration';
import type { AdminTechnicianDetail } from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AdminContractorFieldsProps {
  tech: AdminTechnicianDetail;
  onUpdated: () => void;
}

export function AdminContractorFields({ tech, onUpdated }: AdminContractorFieldsProps) {
  const { toast } = useToast();
  const [providerRole, setProviderRole] = useState<ProviderRole>(
    tech.provider_role === 'contractor' ? 'contractor' : 'technician',
  );
  const [contractorKind, setContractorKind] = useState(
    tech.contractor_kind ?? 'specialist',
  );
  const [capacityTier, setCapacityTier] = useState(tech.capacity_tier ?? 'none');
  const [teamSize, setTeamSize] = useState(tech.team_size ? String(tech.team_size) : '5');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/technicians/${tech.id}/contractor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_role: providerRole,
          contractor_kind: providerRole === 'contractor' ? contractorKind : undefined,
          capacity_tier: capacityTier,
          team_size: providerRole === 'contractor' ? Number(teamSize) : null,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast({
          title: 'تعذّر الحفظ',
          description: body.error ?? 'حاول مرة أخرى',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'تم تحديث الدور والسعة وحجم الفريق' });
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const currentRole = (tech.provider_role === 'contractor' ? 'contractor' : 'technician') as ProviderRole;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-white dark:bg-card p-4">
      <div>
        <p className="text-sm font-semibold">الدور والسعة وحجم الفريق</p>
        <p className="text-xs text-muted-foreground">
          الحالي: {providerRoleLabel(currentRole)}
          {currentRole === 'contractor'
            ? ` — ${contractorKindLabel((tech.contractor_kind ?? 'specialist') as ContractorKind)} — ${capacityTierLabel((tech.capacity_tier ?? 'none') as CapacityTier)}${tech.team_size ? ` — ${teamSizeLabel(tech.team_size)}` : ''}`
            : ` — ${capacityTierLabel((tech.capacity_tier ?? 'none') as CapacityTier)}`}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>الدور</Label>
          <Select value={providerRole} onValueChange={(value) => setProviderRole(value as ProviderRole)}>
            <SelectTrigger id="admin-provider-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVIDER_ROLES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>السعة الحالية</Label>
          <Select value={capacityTier} onValueChange={setCapacityTier}>
            <SelectTrigger id="admin-capacity-tier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CAPACITY_TIERS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {providerRole === 'contractor' && (
          <>
            <div className="space-y-2">
              <Label>نوع المقاول</Label>
              <Select value={contractorKind} onValueChange={setContractorKind}>
                <SelectTrigger id="admin-contractor-kind">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_KINDS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>حجم الفريق</Label>
              <Select value={teamSize} onValueChange={setTeamSize}>
                <SelectTrigger id="admin-team-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAM_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {teamSizeLabel(size)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
      <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
        {saving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        حفظ
      </Button>
    </div>
  );
}
