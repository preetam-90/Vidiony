"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  FileVideo, 
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Play,
  Settings,
  Globe,
  Lock
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  const categories = [
    "Technology",
    "Gaming",
    "Music",
    "Sports",
    "Comedy",
    "Education",
    "Entertainment",
    "News",
    "How-to",
    "Science",
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        alert("Please select a video file");
        return;
      }
      if (file.size > 2 * 1024 * 1024 * 1024) {
        alert("File size must be less than 2GB");
        return;
      }
      setVideoFile(file);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnail(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim()) && tags.length < 10) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!videoFile || !title || !category) {
      alert("Please fill in all required fields");
      return;
    }

    setIsUploading(true);
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadProgress(i);
    }

    // In a real app, you would upload the file to your server
    // const formData = new FormData();
    // formData.append("video", videoFile);
    // formData.append("thumbnail", thumbnailFile);
    // formData.append("title", title);
    // formData.append("description", description);
    // formData.append("category", category);
    // formData.append("tags", JSON.stringify(tags));
    // formData.append("visibility", visibility);
    // await fetch("/api/videos/upload", { method: "POST", body: formData });

    setIsUploading(false);
    router.push("/");
  };

  const removeVideo = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailFile(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold">Upload Video</h1>
          <p className="mt-2 text-muted-foreground">
            Upload and share your video with the world
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Video Upload Area */}
              <div className="rounded-xl border border-dashed border-white/10 bg-card/50 p-6">
                {videoFile ? (
                  <div className="space-y-4">
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                      {thumbnail ? (
                        <img src={thumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileVideo className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                          <Upload className="mr-2 h-4 w-4" />
                          Change Video
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileVideo className="h-5 w-5 text-primary" />
                        <span className="font-medium">{videoFile.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={removeVideo}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col items-center justify-center py-12 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="rounded-full bg-primary/10 p-4">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">Select video to upload</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop or click to browse
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      MP4, WebM, or MKV • Max 2GB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Thumbnail */}
              <div className="rounded-xl border border-white/10 bg-card/50 p-6">
                <h3 className="text-lg font-semibold">Thumbnail</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a thumbnail for your video
                </p>
                
                <div className="mt-4">
                  {thumbnail ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                      <img src={thumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                      <Button
                        variant="secondary"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={removeThumbnail}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/10 bg-secondary/30 hover:bg-secondary/50"
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Click to upload thumbnail
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailSelect}
                  />
                </div>
              </div>

              {/* Video Details */}
              <div className="rounded-xl border border-white/10 bg-card/50 p-6 space-y-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Add a title for your video"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell viewers about your video"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 min-h-[120px]"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1.5 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="mt-1.5">
                    <Input
                      placeholder="Press Enter to add tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                    />
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                            {tag}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Visibility */}
              <div className="rounded-xl border border-white/10 bg-card/50 p-6">
                <h3 className="font-semibold">Visibility</h3>
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => setVisibility("public")}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      visibility === "public" 
                        ? "border-primary bg-primary/10" 
                        : "border-white/10 hover:bg-secondary/50"
                    }`}
                  >
                    <Globe className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Public</p>
                      <p className="text-xs text-muted-foreground">Anyone can view</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setVisibility("private")}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                      visibility === "private" 
                        ? "border-primary bg-primary/10" 
                        : "border-white/10 hover:bg-secondary/50"
                    }`}
                  >
                    <Lock className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Private</p>
                      <p className="text-xs text-muted-foreground">Only you can view</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="rounded-xl border border-white/10 bg-card/50 p-6">
                  <h3 className="font-semibold">Uploading...</h3>
                  <Progress value={uploadProgress} className="mt-4" />
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    {uploadProgress}%
                  </p>
                </div>
              )}

              {/* Requirements */}
              <div className="rounded-xl border border-white/10 bg-card/50 p-6">
                <h3 className="font-semibold">Upload Requirements</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Video file (MP4, WebM, or MKV)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Maximum file size: 2GB
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Video resolution: 1280x720 or higher
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Title is required
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Category is required
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleUpload}
                  disabled={isUploading || !videoFile || !title || !category}
                >
                  {isUploading ? "Uploading..." : "Publish"}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={isUploading}
                >
                  Save as Draft
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
