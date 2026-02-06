"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Loader2 } from "lucide-react";

export interface PlanRequest {
  movieTitle: string;
  preferredDay: string;
  notes: string;
  includeMeal: boolean;
}

interface PlanFormProps {
  onSubmit: (request: PlanRequest) => void;
  loading: boolean;
}

export function PlanForm({ onSubmit, loading }: PlanFormProps) {
  const [movieTitle, setMovieTitle] = useState("");
  const [preferredDay, setPreferredDay] = useState("any");
  const [notes, setNotes] = useState("");
  const [includeMeal, setIncludeMeal] = useState(false);

  const handleSubmit = () => {
    if (!movieTitle.trim() || loading) return;
    onSubmit({
      movieTitle: movieTitle.trim(),
      preferredDay,
      notes: notes.trim(),
      includeMeal,
    });
  };

  return (
    <Card className="border-neutral-200">
      <CardContent className="p-5 space-y-5">
        {/* 映画名 */}
        <div>
          <Label htmlFor="movieTitle" className="text-sm font-medium text-neutral-800">
            映画タイトル
          </Label>
          <Input
            id="movieTitle"
            placeholder="例: 閃光のハサウェイ"
            value={movieTitle}
            onChange={(e) => setMovieTitle(e.target.value)}
            className="mt-1.5 rounded-lg"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        {/* 曜日指定 */}
        <div>
          <Label className="text-sm font-medium text-neutral-800">
            いつ観たい？
          </Label>
          <Select value={preferredDay} onValueChange={setPreferredDay}>
            <SelectTrigger className="mt-1.5 rounded-lg">
              <SelectValue placeholder="指定なし" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">指定なし（直近で探す）</SelectItem>
              <SelectItem value="today">今日</SelectItem>
              <SelectItem value="tomorrow">明日</SelectItem>
              <SelectItem value="this-weekend">今週末</SelectItem>
              <SelectItem value="next-weekend">来週末</SelectItem>
              <SelectItem value="weekday">平日</SelectItem>
              <SelectItem value="monday">月曜</SelectItem>
              <SelectItem value="tuesday">火曜</SelectItem>
              <SelectItem value="wednesday">水曜</SelectItem>
              <SelectItem value="thursday">木曜</SelectItem>
              <SelectItem value="friday">金曜</SelectItem>
              <SelectItem value="saturday">土曜</SelectItem>
              <SelectItem value="sunday">日曜</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 考慮事項 */}
        <div>
          <Label htmlFor="notes" className="text-sm font-medium text-neutral-800">
            考慮してほしいこと
            <span className="ml-1.5 text-xs font-normal text-neutral-400">任意</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="例: 子ども連れです / 授乳があるので3時間以内で / 車椅子席希望"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1.5 rounded-lg resize-none text-sm"
          />
        </div>

        {/* 食事提案 */}
        <div className="flex items-center justify-between py-1">
          <div>
            <Label htmlFor="includeMeal" className="text-sm font-medium text-neutral-800">
              食事の提案を含める
            </Label>
            <p className="text-xs text-neutral-500 mt-0.5">
              映画前後のランチ・ディナーを提案します
            </p>
          </div>
          <Switch
            id="includeMeal"
            checked={includeMeal}
            onCheckedChange={setIncludeMeal}
          />
        </div>

        {/* 送信 */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !movieTitle.trim()}
          className="w-full rounded-xl bg-neutral-900 hover:bg-neutral-800 h-11"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              プランを作成中...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              プランを探す
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
