# Script for populating the database. You can run it as:
#
#     mix run priv/repo/seeds.exs
#
# Inside the script, you can read and write to any of your
# repositories directly:
#
#     Shared.Repo.insert!(%Shared.SomeModel{})
#
# We recommend using the bang functions (`insert!`, `update!`
# and so on) as they will fail if something goes wrong.

# Shared.Repo.insert!(%Shared.ListingReleaseType{ id: "saved" })
Shared.Repo.insert!{%Shared.User{id: 0, type: "root"}}
Shared.Repo.insert!(%Shared.ListingReleaseType{ id: "staged" })
Shared.Repo.insert!(%Shared.ListingReleaseType{ id: "posted" })

Shared.Repo.insert!(%Shared.ListingVisibilityType{ id: "private" })
Shared.Repo.insert!(%Shared.ListingVisibilityType{ id: "hidden" })
Shared.Repo.insert!(%Shared.ListingVisibilityType{ id: "public" })

Shared.Repo.insert!(%Shared.ListingType{ id: "gathering" })
Shared.Repo.insert!(%Shared.ListingType{ id: "show" })
Shared.Repo.insert!(%Shared.ListingType{ id: "rendezvous" })

