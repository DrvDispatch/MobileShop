import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LoginForm, GoogleButton } from "@/components/auth";

export default function LoginPage() {
    return (
        <Card className="backdrop-blur-lg bg-white/80">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome back</CardTitle>
                <CardDescription>
                    Sign in to your account to continue
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <GoogleButton />

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-zinc-500">Or continue with</span>
                    </div>
                </div>

                <LoginForm />

                <p className="text-center text-sm text-zinc-600">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="text-zinc-900 hover:underline font-medium">
                        Sign up
                    </Link>
                </p>
            </CardContent>
        </Card>
    );
}
