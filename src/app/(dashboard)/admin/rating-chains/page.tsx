export default function AdminRatingChainsPage() {
  return (
    <div className="p-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Rating Chains</h1>
      <p className="text-sm text-muted-foreground">
        Define rater / senior rater / reviewer relationships.
      </p>
      {/* TODO: rating chain editor → GET/POST /api/rating-chains */}
    </div>
  );
}
