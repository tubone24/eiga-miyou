"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, KeyRound, Save, Check } from "lucide-react";

interface SettingsFormProps {
  userId: string;
}

export function SettingsForm({ userId }: SettingsFormProps) {
  const [address, setAddress] = useState({
    postalCode: "",
    prefecture: "",
    city: "",
    street: "",
  });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadAddress = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/address");
      if (!res.ok) return;
      const data = await res.json();
      if (data.addresses && data.addresses.length > 0) {
        const addr = data.addresses[0];
        setAddress({
          postalCode: addr.postalCode ?? "",
          prefecture: addr.prefecture ?? "",
          city: addr.city ?? "",
          street: addr.street ?? "",
        });
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadAddress();
  }, [loadAddress]);

  const handleSaveAddress = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/settings/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: "home",
          postalCode: address.postalCode || undefined,
          prefecture: address.prefecture,
          city: address.city,
          street: address.street,
          isDefault: true,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tabs defaultValue="address" className="w-full">
      <TabsList className="w-full justify-start bg-white border border-neutral-200 rounded-xl p-1">
        <TabsTrigger value="address" className="flex items-center gap-1.5 rounded-lg text-xs">
          <MapPin className="h-3.5 w-3.5" />
          住所
        </TabsTrigger>
        <TabsTrigger value="accounts" className="flex items-center gap-1.5 rounded-lg text-xs">
          <KeyRound className="h-3.5 w-3.5" />
          映画館アカウント
        </TabsTrigger>
      </TabsList>

      <TabsContent value="address" className="mt-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            {!loaded ? (
              <p className="text-sm text-neutral-400 text-center py-4">読み込み中...</p>
            ) : (
              <>
                <div>
                  <Label htmlFor="postalCode" className="text-xs text-neutral-600">
                    郵便番号
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="123-4567"
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="prefecture" className="text-xs text-neutral-600">
                      都道府県
                    </Label>
                    <Input
                      id="prefecture"
                      placeholder="東京都"
                      value={address.prefecture}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, prefecture: e.target.value }))
                      }
                      className="mt-1 rounded-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-xs text-neutral-600">
                      市区町村
                    </Label>
                    <Input
                      id="city"
                      placeholder="渋谷区"
                      value={address.city}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, city: e.target.value }))
                      }
                      className="mt-1 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="street" className="text-xs text-neutral-600">
                    番地・建物名
                  </Label>
                  <Input
                    id="street"
                    placeholder="道玄坂1-2-3"
                    value={address.street}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, street: e.target.value }))
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <Button
                  onClick={handleSaveAddress}
                  disabled={saving || !address.prefecture || !address.city || !address.street}
                  className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      保存しました
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      住所を保存
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="accounts" className="mt-4">
        <div className="space-y-3">
          {[
            { chain: "toho", name: "TOHOシネマズ", color: "bg-red-50 border-red-100" },
            { chain: "aeon", name: "イオンシネマ", color: "bg-purple-50 border-purple-100" },
            { chain: "cinema109", name: "109シネマズ", color: "bg-blue-50 border-blue-100" },
          ].map((theater) => (
            <Card key={theater.chain} className={theater.color}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">{theater.name}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5">未連携</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg text-xs">
                    連携する
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
