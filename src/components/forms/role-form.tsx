"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminRole, createRole, updateRole } from "@/services/admin/roles";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const roleSchema = z.object({
  name: z.string().min(2, "Rol adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, "En az bir yetki seçilmelidir"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const availablePermissions = [
  { id: "listings.manage", label: "İlan Yönetimi", description: "İlanları onaylama, reddetme ve silme" },
  { id: "reports.manage", label: "Şikayet Yönetimi", description: "Kullanıcı şikayetlerini inceleme ve çözme" },
  { id: "users.manage", label: "Kullanıcı Yönetimi", description: "Kullanıcıları dondurma veya silme" },
  { id: "settings.manage", label: "Sistem Ayarları", description: "Bakım modu ve genel platform ayarları" },
  { id: "plans.manage", label: "Paket Yönetimi", description: "Üyelik paketlerini düzenleme" },
  { id: "tickets.manage", label: "Destek Yönetimi", description: "Destek taleplerini yanıtlama" },
];

interface RoleFormProps {
  initialData?: AdminRole | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RoleForm({ initialData, onSuccess, onCancel }: RoleFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      permissions: initialData?.permissions || [],
    },
  });

  const onSubmit = async (values: RoleFormValues) => {
    setLoading(true);
    try {
      if (initialData) {
        await updateRole(initialData.id, values);
        toast.success("Rol başarıyla güncellendi");
      } else {
        await createRole(values.name, values.description || "", values.permissions);
        toast.success("Yeni rol oluşturuldu");
      }
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : "İşlem sırasında bir hata oluştu";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permId: string) => {
    const current = form.getValues("permissions");
    if (current.includes(permId)) {
      form.setValue("permissions", current.filter(id => id !== permId));
    } else {
      form.setValue("permissions", [...current, permId]);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rol Adı</Label>
            <Input {...form.register("name")} placeholder="Örn: Bölge Sorumlusu" className="rounded-xl" />
            {form.formState.errors.name && <p className="text-[10px] font-bold text-rose-500">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Açıklama</Label>
            <Textarea {...form.register("description")} placeholder="Bu rolün görevlerini kısaca açıklayın..." className="rounded-xl min-h-[80px]" />
          </div>

          <div className="pt-2">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4 block">Yetki Tanımları</Label>
            <div className="grid gap-3">
               {availablePermissions.map((perm) => (
                 <div 
                   key={perm.id} 
                   className={`flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                     form.watch("permissions").includes(perm.id) 
                       ? "border-blue-200 bg-blue-50/50" 
                       : "border-border/50 bg-muted/30 hover:border-border"
                   }`}
                   onClick={() => togglePermission(perm.id)}
                 >
                    <Checkbox 
                      id={perm.id}
                      checked={form.watch("permissions").includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="space-y-1 cursor-pointer">
                      <label htmlFor={perm.id} className="text-sm font-black text-foreground block cursor-pointer">{perm.label}</label>
                      <p className="text-[10px] text-muted-foreground font-medium italic leading-tight">{perm.description}</p>
                    </div>
                 </div>
               ))}
            </div>
            {form.formState.errors.permissions && <p className="text-[10px] font-bold text-rose-500 mt-2">{form.formState.errors.permissions.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl h-11 font-black text-[10px] tracking-widest uppercase border-border"
          onClick={onCancel}
        >
          İptal
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-xl h-11 font-black text-[10px] tracking-widest uppercase bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin size-4" /> : initialData ? "GÜNCELLE" : "ROLÜ OLUŞTUR"}
        </Button>
      </div>
    </form>
  );
}
