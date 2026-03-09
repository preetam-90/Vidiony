import { redirect } from "next/navigation";

export default function UploadPage() {
  // /upload route removed — redirect to home
  redirect("/");
}