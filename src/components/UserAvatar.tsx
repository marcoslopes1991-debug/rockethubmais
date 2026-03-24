import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import avatarMale from "@/assets/avatar-male.png";
import avatarFemale from "@/assets/avatar-female.png";

interface UserAvatarProps {
  avatarUrl?: string | null;
  gender?: string | null;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

const UserAvatar = ({ avatarUrl, gender, displayName, size = "md", className }: UserAvatarProps) => {
  const fallbackAvatar = gender === "feminino" ? avatarFemale : avatarMale;
  const src = avatarUrl || fallbackAvatar;
  const initials = displayName?.slice(0, 2).toUpperCase() || "?";

  return (
    <Avatar className={cn(sizeClasses[size], "border-2 border-primary/30", className)}>
      <AvatarImage src={src} alt={displayName || "Avatar"} className="object-cover" />
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;
