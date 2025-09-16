'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Loader2 } from 'lucide-react';

export type Hit = { 
  idx: number; 
  score: number; 
  vec_sim: number; 
  trgm_sim: number; 
  preview: string; 
};

type Props = { 
  hits: Hit[]; 
  topScore?: number; 
  loading?: boolean; 
};

export function RagHitsTable({ hits, topScore, loading }: Props) {
  const truncatePreview = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getScoreColor = (score: number, topScore?: number) => {
    if (!topScore) return 'bg-gray-100';
    const ratio = score / topScore;
    if (ratio >= 0.8) return 'bg-green-100 text-green-800';
    if (ratio >= 0.6) return 'bg-yellow-100 text-yellow-800';
    if (ratio >= 0.4) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Chat Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading results...</span>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-4 p-2">
                  <div className="w-8 h-6 bg-muted animate-pulse rounded"></div>
                  <div className="w-16 h-6 bg-muted animate-pulse rounded"></div>
                  <div className="w-16 h-6 bg-muted animate-pulse rounded"></div>
                  <div className="w-16 h-6 bg-muted animate-pulse rounded"></div>
                  <div className="flex-1 h-6 bg-muted animate-pulse rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Chat Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No results found</p>
            <p className="text-sm text-muted-foreground">
              Try increasing topK or changing your search terms
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Chat Results</span>
          </div>
          {topScore && (
            <Badge variant="secondary" className="text-sm">
              Top Score: {topScore.toFixed(3)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead className="w-20">Score</TableHead>
                <TableHead className="w-24">Vec Sim</TableHead>
                <TableHead className="w-24">Trgm Sim</TableHead>
                <TableHead>Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hits.map((hit) => (
                <TableRow key={hit.idx}>
                  <TableCell className="font-medium">{hit.idx}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={getScoreColor(hit.score, topScore)}
                    >
                      {hit.score.toFixed(3)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {hit.vec_sim.toFixed(3)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {hit.trgm_sim.toFixed(3)}
                  </TableCell>
                  <TableCell 
                    className="text-sm"
                    title={hit.preview}
                  >
                    {truncatePreview(hit.preview)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
