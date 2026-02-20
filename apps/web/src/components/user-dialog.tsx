import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { LoadingButton } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Switch } from "~/components/ui/switch";
import { toast } from "~/hooks/use-toast";
import type { SessionUser } from "~/lib/auth/session";
import { cn } from "~/lib/utils";
import { orpc } from "~/orpc/client";
import { Route } from "~/routes/dashboard/users";

type EditableUser = Pick<
  SessionUser,
  "firstName" | "lastName" | "email" | "isAdmin" | "id"
>;
export type DialogUser = EditableUser;

const userDialogBaseSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  isAdmin: z.boolean(),
  showPasswordInput: z.boolean().optional(),
});

const userDialogSchema = z.discriminatedUnion("mode", [
  userDialogBaseSchema.extend({
    mode: z.literal("create"),
    password: z.string().min(3),
  }),
  userDialogBaseSchema.extend({
    mode: z.literal("edit"),
    id: z.string(),
    password: z.string().nullable().optional(),
    showPasswordInput: z.boolean(),
  }),
]);

type UserDialogFormValues = z.infer<typeof userDialogSchema>;

type UserDialogFormProps =
  | {
      user?: never;
      action: "create";
      onAfterSuccessfulSubmit?: (values: UserDialogFormValues) => void;
    }
  | {
      user: DialogUser;
      action: "edit";
      onAfterSuccessfulSubmit?: (values: UserDialogFormValues) => void;
    };

function UserDialogForm({
  action,
  user,
  onAfterSuccessfulSubmit,
}: UserDialogFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UserDialogFormValues>({
    resolver: zodResolver(userDialogSchema),
    defaultValues: {
      password: "",
      showPasswordInput: false,
      ...(user ?? {
        email: "",
        firstName: "",
        lastName: "",
        isAdmin: false,
        id: undefined,
      }),
      mode: action,
    },
  });

  const updateMutation = useMutation(orpc.users.update.mutationOptions());
  const createMutation = useMutation(orpc.users.create.mutationOptions());

  async function onSubmit(values: UserDialogFormValues) {
    try {
      if (values.mode === "edit") {
        await updateMutation.mutateAsync({
          ...values,
          password: values.password ?? null,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      form.reset();
      onAfterSuccessfulSubmit?.(values);
      void queryClient.invalidateQueries({
        queryKey: orpc.users.getMultiple.queryKey({ input: {} }),
      });
    } catch (e) {
      toast({
        title: "Error",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  }

  const mode = form.watch("mode");
  const showPasswordInput = form.watch("showPasswordInput");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input
                  placeholder="jane@doe.com"
                  autoComplete="username"
                  {...field}
                  type="email"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isAdmin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin</FormLabel>
              <FormControl>
                <div className="justify-left flex flex-row items-center gap-4">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <FormDescription>Is an Admin</FormDescription>
                </div>
              </FormControl>
            </FormItem>
          )}
        />
        <FormItem>
          <FormLabel
            className={cn(form.formState.errors.password && "text-destructive")}
          >
            {mode === "edit" ? "Change" : "Set"} Password
          </FormLabel>
          <FormControl>
            <div className="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="showPasswordInput"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={(e) => {
                        field.onChange(e);
                        if (!e) {
                          form.setValue("password", null); // Set to null instead of empty string
                        }
                      }}
                    />
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => {
                  const isDisabled = mode === "edit" && !showPasswordInput;
                  return (
                    <>
                      <PasswordInput
                        {...field}
                        value={field.value ?? ""}
                        disabled={isDisabled}
                        autoComplete="new-password"
                      />
                      <FormMessage className="w-full shrink-0" />
                    </>
                  );
                }}
              />
            </div>
          </FormControl>
        </FormItem>
        <DialogFooter>
          <LoadingButton type="submit" loading={form.formState.isSubmitting}>
            {user?.id ? "Save changes" : "Create user"}
          </LoadingButton>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function UserDialog() {
  const queryClient = useQueryClient();
  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();

  const action = searchParams.action;
  const { data: user } = useQuery({
    ...orpc.users.get.queryOptions({
      input: {
        id: searchParams.action === "edit" ? searchParams.userId : "",
        mode: "id",
      },
    }),
    enabled: action === "edit",
  });

  const navigateToUsers = useCallback(() => {
    return navigate({
      to: "/dashboard/users",
      replace: true,
      search: (prev) => ({
        ...prev,
        action: undefined,
        userId: undefined,
      }),
    });
  }, [navigate]);

  const formKey = `${action}-${JSON.stringify(user)}`;

  return (
    <Dialog
      open={!!action}
      onOpenChange={(state) => {
        if (!state) void navigateToUsers();
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {action === "edit" ? "Edit" : "Create"} User
          </DialogTitle>
          <DialogDescription>
            Make changes to the user here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        {action === "edit" && !user ? (
          <div>User not found</div>
        ) : action === "create" ? (
          <UserDialogForm
            key={formKey}
            action="create"
            onAfterSuccessfulSubmit={(values) => {
              void queryClient.invalidateQueries({
                queryKey: ["user"],
              });
              void navigateToUsers();

              toast({
                title: "User created",
                description: `User ${values.firstName} ${values.lastName} has been created`,
              });
            }}
          />
        ) : user ? (
          <UserDialogForm
            key={formKey}
            action="edit"
            user={user}
            onAfterSuccessfulSubmit={(values) => {
              void queryClient.invalidateQueries({
                queryKey: ["user"],
              });
              void navigateToUsers();

              toast({
                title: "User updated",
                description: `User ${values.firstName} ${values.lastName} has been updated`,
              });
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
